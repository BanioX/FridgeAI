import { localDate } from '../dates';
import { parseChf, rappen, sumRappen, type Rappen } from '../money';
import type { ReceiptLineKind } from '../model/receipt';
import type { LocalDate, Retailer } from '../model/primitives';

/** One line of a receipt as read from OCR or PDF text, before review (ADR-0027). */
export interface ParsedReceiptLine {
  rawText: string;
  kind: Extract<ReceiptLineKind, 'item' | 'discount' | 'deposit' | 'bag'>;
  name: string;
  /** Pieces for `pcs`, grams for `g` (weighed goods such as bananas or a chicken pack). */
  quantity: number;
  unit: 'pcs' | 'g';
  /** Regular price per piece, or per kilogram for weighed goods. */
  unitPriceRappen?: Rappen;
  /** Regular amount of the line, before discounts. Negative for receipt-wide discounts. */
  priceRappen: Rappen;
  /** Discounts on this line: «Aktion» or «Gespart» columns and «Rabatt» lines below it (≤ 0). */
  discountRappen: Rappen;
  /**
   * First guess from the VAT rate: standard rate is never food; the reduced rate also covers pet
   * food, medicine and menstrual products, so review and category matching refine it. Absent when
   * the receipt does not say.
   */
  isFood?: boolean;
}

export interface ParsedReceipt {
  retailer: Retailer;
  storeName?: string;
  purchasedOn?: LocalDate;
  /** Local time as printed, `HH:MM`. */
  purchasedTime?: string;
  lines: ParsedReceiptLine[];
  /** Total as printed on the receipt, if found. */
  totalRappen: Rappen | null;
  /** Sum of the lines after discounts, with deposit and bags. */
  computedTotalRappen: Rappen;
  /** Whether the lines add up to the printed total (OCR errors and missing lines show here). */
  sumCheck: 'ok' | 'mismatch' | 'no-total';
}

const RETAILERS: readonly string[] = ['migros', 'coop', 'aldi', 'lidl', 'denner'];

const KEYWORDS = {
  total: /^(total|summe|gesamttotal|gesamtbetrag|endbetrag|zu bezahlen|dein lidl preis)\b/,
  subtotal: /\b(zwischensumme|zwischentotal|subtotal)\b/,
  // Before the total only; payment and VAT lines after it are never read as items.
  payment:
    /\b(bezahlt|zahlung|kartenzahlung|mastercard|visa|maestro|twint|postfinance|rueckgeld)\b/,
  other:
    /\b(mwst|mehrwertsteuer|tva|superpunkte|cumulus|sie sparen|gespart|ersparnis|preisvorteil)\b/,
  deposit: /\b(pfand|depot|consigne|mehrweg)\b/,
  bag: /\b(tragtaschen?|tragetaschen?|einkaufstaschen?|papiertaschen?|papiertragtaschen?|papiersack|plastiksack|tragsack|tuete)\b/,
  wideDiscount: /\b(einkauf|gutschein|alles|gesamt|treuerabatt|mitarbeiterrabatt|bonus)/,
  discount: /\b(rabatt|aktion|reduktion|reduziert|coupon|gutschein)\b/,
};

const AMOUNT = /^-?\d{1,4}\.\d{2}-?$/;
/** VAT group and markers after the amount: Coop «0 A», «1 # A», Migros «S1», Lidl «B». */
const CODE = /^(?:[0-9A-D#*]|S\d)$/;
const PIECES = /^(\d{1,3})(?:\.0)?x?$/i;
const WEIGHT_KG = /^(\d{1,3}\.\d{3})(?:kg)?$/;
const DECOR = /^(?:x|×|à|@|chf|kg|\/kg|chf\/kg)$/i;
/** A detail line under an item (Lidl): «4 x 0.79», «0.984 kg x 1.99 CHF/kg». */
const DETAIL = /^(\d{1,3}(?:\.\d{1,3})?) ?(kg)? ?[x×à] ?(\d{1,4}\.\d{2})(?: ?(?:chf)? ?\/? ?kg)?$/i;
const SEPARATOR = /^[-=_*~.:¦| ]+$/;
const STORE_SKIP = /genossenschaft|hotline|www|artikel|lohnt sich|quittung|^chf$/i;

function plain(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim();
}

const amountOf = (token: string | undefined): Rappen | null =>
  token !== undefined && AMOUNT.test(token) ? parseChf(token) : null;

/**
 * Cleans one OCR line: one kind of minus, single spaces, and typical OCR slips inside amounts
 * («l.95» → «1.95», «3,95» → «3.95», «1O.50» → «10.50», «3 .95» → «3.95», «0,.10» → «0.10»).
 */
export function normalizeReceiptLine(raw: string): string {
  return raw
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(\d)(?:,\.|\.,)(\d)/g, '$1.$2')
    .replace(/(\d) ?([.,]) ?(\d{2,3})(?![\d])/g, '$1$2$3')
    .replace(
      /(?<![\p{L}])[\dOolI|]*\d[\dOolI|]*[.,][\dOo]{2,3}-?(?![\p{L}])|(?<![\p{L}])[OolI|][.,]\d{2}-?(?![\p{L}])/gu,
      (token) => token.replace(/[Oo]/g, '0').replace(/[lI|]/g, '1').replace(',', '.'),
    );
}

interface LineNumbers {
  name: string;
  /** Regular line amount; `null` when the line carries no amount. */
  price: Rappen | null;
  discount: Rappen;
  quantity?: number;
  unit?: 'pcs' | 'g';
  unitPrice?: Rappen;
  vatCode?: string;
}

const perKg = (grams: number, price: Rappen) => rappen(Math.round((grams * price) / 1000));
const near = (a: number, b: number) => Math.abs(a - b) <= 1;

/**
 * Explains the numbers before the line total: quantity × price, with an «Aktion» price (Coop) or
 * a «Gespart» amount (Migros), for pieces, goods priced per kilogram and weighed packs.
 */
function explain(quantity: string, amounts: readonly Rappen[], total: Rappen) {
  const [price, second] = amounts;
  if (price === undefined) {
    return null;
  }
  const kg = WEIGHT_KG.exec(quantity)?.[1];
  if (kg !== undefined) {
    const grams = Math.round(Number(kg) * 1000);
    // Priced per kilogram (bananas), or a weighed pack with its own price (chicken breast).
    const options = [
      { gross: perKg(grams, price), unitPrice: price, promotional: (p: Rappen) => perKg(grams, p) },
      {
        gross: price,
        unitPrice: rappen(Math.round((price * 1000) / grams)),
        promotional: (p: Rappen) => p,
      },
    ];
    for (const { gross, unitPrice, promotional } of options) {
      const fits =
        second === undefined
          ? near(gross, total)
          : near(promotional(second), total) || near(gross - second, total);
      if (fits) {
        const exact = second === undefined ? total : gross;
        return {
          quantity: grams,
          unit: 'g' as const,
          unitPrice,
          gross: exact,
          discount: rappen(total - exact),
        };
      }
    }
    return null;
  }
  const count = Number(PIECES.exec(quantity)?.[1] ?? Number.NaN);
  if (!Number.isInteger(count) || count < 1) {
    return null;
  }
  const gross = rappen(count * price);
  const fits =
    second === undefined ? gross === total : count * second === total || gross - second === total;
  return fits
    ? {
        quantity: count,
        unit: 'pcs' as const,
        unitPrice: price,
        gross,
        discount: rappen(total - gross),
      }
    : null;
}

/** Splits «Coop Skyr 150g 2.0 1.60 1.40 2.80 0 A» into name, quantity, prices and VAT code. */
function readNumbers(line: string): LineNumbers {
  const tokens = line.split(' ');
  let end = tokens.length;
  while (end > 1 && tokens.length - end < 3 && CODE.test(tokens[end - 1] ?? '')) {
    end -= 1;
  }
  const total = amountOf(tokens[end - 1]);
  if (total === null) {
    return { name: line, price: null, discount: rappen(0) };
  }
  const vatCode = tokens[end]?.replace(/^S/, '');
  const code = vatCode === undefined || vatCode === '#' ? {} : { vatCode };
  const rest = tokens.slice(0, end - 1).filter((token) => !DECOR.test(token));
  const amounts: Rappen[] = [];
  let start = rest.length;
  while (start > 0 && amounts.length < 2) {
    const amount = amountOf(rest[start - 1]);
    if (amount === null) {
      break;
    }
    amounts.unshift(amount);
    start -= 1;
  }
  const explained = start > 0 ? explain(rest[start - 1] ?? '', amounts, total) : null;
  if (explained !== null) {
    const { gross, discount, ...quantity } = explained;
    const name = rest.slice(0, start - 1).join(' ');
    return { name, price: gross, discount, ...quantity, ...code };
  }
  // Quantity and price that do not fit the amount (a misread digit): keep the name clean and the
  // amount as printed; the sum check shows the slip, the review lets the person correct it.
  const quantityToken = start > 0 ? (rest[start - 1] ?? '') : '';
  const pieces = PIECES.exec(quantityToken)?.[1];
  const kg = WEIGHT_KG.exec(quantityToken)?.[1];
  if (amounts.length > 0 && (pieces !== undefined || kg !== undefined)) {
    const name = rest.slice(0, start - 1).join(' ');
    const quantity =
      kg === undefined
        ? { quantity: Number(pieces), unit: 'pcs' as const }
        : { quantity: Math.round(Number(kg) * 1000), unit: 'g' as const };
    return { name, price: total, discount: rappen(0), ...quantity, ...code };
  }
  if (amounts.length === 1 && amounts[0] === total) {
    const name = rest.slice(0, start).join(' ');
    return {
      name,
      price: total,
      discount: rappen(0),
      quantity: 1,
      unit: 'pcs',
      unitPrice: total,
      ...code,
    };
  }
  return { name: rest.join(' '), price: total, discount: rappen(0), ...code };
}

/** «A 2.6 % MwSt», «0 2.60 41.15 1.04», «1 2.60 % 14.15 0.36»: VAT group → rate in percent. */
function readVatRates(rows: readonly string[]): Map<string, number> {
  const rates = new Map<string, number>();
  for (const row of rows) {
    const match = /^([0-9A-D]) (\d{1,2}\.\d{1,2}) ?%?(?: |$)/.exec(row);
    if (match?.[1] !== undefined && match[2] !== undefined && !rates.has(match[1])) {
      rates.set(match[1], Number(match[2]));
    }
  }
  return rates;
}

function detectRetailer(rows: readonly string[]): Retailer {
  const head = rows.slice(0, 8).map(plain).join(' ');
  const all = rows.map(plain).join(' ');
  for (const text of [head, all]) {
    const found = RETAILERS.find((retailer) => new RegExp(`\\b${retailer}\\b`).test(text));
    if (found !== undefined) {
      return found as Retailer;
    }
  }
  return 'other';
}

/** The branch on top of the receipt: «Schwerzenbach Chimli», «M Aarau Bahnhof». */
function detectStore(rows: readonly string[]): string | undefined {
  return rows
    .slice(0, 3)
    .find(
      (row) =>
        readNumbers(row).price === null &&
        // Logos read by OCR come out as «® Comm ieh |»: only plain words count.
        /^[\p{L}\d .,'’&-]+$/u.test(row) &&
        /\p{L}{4}/u.test(row) &&
        !/[:+@]|\d{2}\.\d{2}\.\d{2}/.test(row) &&
        !STORE_SKIP.test(row) &&
        !RETAILERS.includes(plain(row)),
    )
    ?.slice(0, 80);
}

function detectDate(text: string): { purchasedOn?: LocalDate; purchasedTime?: string } {
  const date = /\b(\d{2})\.(\d{2})\.(\d{4}|\d{2})\b/;
  const match = new RegExp(`${date.source} +(\\d{2}):(\\d{2})`).exec(text) ?? date.exec(text);
  if (match === null) {
    return {};
  }
  const [, day, month, year = '', hours, minutes] = match;
  try {
    const purchasedOn = localDate(`${year.length === 2 ? `20${year}` : year}-${month}-${day}`);
    const valid =
      hours !== undefined && minutes !== undefined && Number(hours) < 24 && Number(minutes) < 60;
    return { purchasedOn, ...(valid ? { purchasedTime: `${hours}:${minutes}` } : {}) };
  } catch {
    return {};
  }
}

/**
 * A discount cannot exceed what is left of the item: «-6.13» under a 2.95 item is a misread
 * «-0.13» (photos read 0 as 6, 8 or 9), so the first digit becomes 0 if that fits.
 */
function plausibleDiscount(discount: Rappen, item: ParsedReceiptLine): Rappen {
  const left = item.priceRappen + item.discountRappen;
  const amount = Math.abs(discount);
  if (amount <= left) {
    return discount;
  }
  const digits = String(amount);
  const fixed = Number(`0${digits.slice(1)}`);
  return fixed <= left ? rappen(-fixed) : discount;
}

/** Same number of digits, exactly one of them different (OCR reads «0» as «9»). */
function oneDigitApart(a: number, b: number): boolean {
  const [x, y] = [String(a), String(b)];
  let differences = 0;
  for (let index = 0; index < x.length; index += 1) {
    differences += x[index] === y[index] ? 0 : 1;
  }
  return x.length === y.length && differences === 1;
}

/** Lidl prints «4 x 0.79» or «0.984 kg x 1.99 CHF/kg» below the item; it must match its amount. */
function applyDetail(item: ParsedReceiptLine | null, detail: RegExpExecArray) {
  const [, amount = '', kg, price] = detail;
  const unitPrice = amountOf(price);
  if (item === null || unitPrice === null) {
    return;
  }
  if (kg !== undefined || /\.\d{3}$/.test(amount)) {
    const grams = Math.round(Number(amount) * 1000);
    if (near(perKg(grams, unitPrice), item.priceRappen)) {
      Object.assign(item, { quantity: grams, unit: 'g', unitPriceRappen: unitPrice });
    }
    return;
  }
  const count = Number(amount);
  const product = count * unitPrice;
  // «6.99» above «2 x 3.45»: two numbers that agree beat one misread digit (photos, ADR-0027).
  if (
    Number.isInteger(count) &&
    (product === item.priceRappen || oneDigitApart(product, item.priceRappen))
  ) {
    Object.assign(item, {
      quantity: count,
      unitPriceRappen: unitPrice,
      priceRappen: rappen(product),
    });
  }
}

/**
 * Reads a receipt from OCR or PDF text (ADR-0027). Knows the layouts of Coop («Menge Preis Aktion
 * Total»), Migros («Gespart») and Lidl (quantity and «Lidl Plus Rabatt» below the item) and falls
 * back to «name … amount». Checks the lines against the printed total to the Rappen; the VAT table
 * below the total tells food (reduced rate) from everything else.
 */
export function parseReceiptText(text: string): ParsedReceipt {
  const rows = text
    .split(/\r?\n/)
    .map(normalizeReceiptLine)
    .filter((row) => row !== '' && !SEPARATOR.test(row));
  const totalIndex = rows.findIndex((row) => {
    const numbers = readNumbers(row);
    return numbers.price !== null && KEYWORDS.total.test(plain(numbers.name));
  });
  const body = totalIndex === -1 ? rows : rows.slice(0, totalIndex);
  const totalRappen = totalIndex === -1 ? null : readNumbers(rows[totalIndex] ?? '').price;
  const vatRates = readVatRates(totalIndex === -1 ? [] : rows.slice(totalIndex + 1));
  const lines: ParsedReceiptLine[] = [];
  let pendingName = '';
  let lastItem: ParsedReceiptLine | null = null;
  let afterSubtotal = false;

  for (const row of body) {
    const detail = DETAIL.exec(row);
    if (detail !== null) {
      applyDetail(lastItem, detail);
      continue;
    }
    const numbers = readNumbers(row);
    const words = plain(numbers.name);
    if (numbers.price === null) {
      // A name on its own line belongs to the amount on the next line (weighed goods, multiples).
      pendingName = KEYWORDS.subtotal.test(words) || KEYWORDS.payment.test(words) ? '' : row;
      continue;
    }
    if (KEYWORDS.subtotal.test(words)) {
      afterSubtotal = true;
      lastItem = null;
      continue;
    }
    if (KEYWORDS.payment.test(words) || KEYWORDS.other.test(words)) {
      continue;
    }
    const name = numbers.name === '' ? pendingName : numbers.name;
    pendingName = '';
    // A photo can lose the minus: «Rabatt 0.50» right below an item is still a discount.
    const price =
      numbers.price > 0 && lastItem !== null && KEYWORDS.discount.test(words)
        ? rappen(0 - numbers.price)
        : numbers.price;
    if (price < 0) {
      if (lastItem !== null && !afterSubtotal && !KEYWORDS.wideDiscount.test(words)) {
        const discount = plausibleDiscount(price, lastItem);
        lastItem.discountRappen = rappen(lastItem.discountRappen + discount);
        continue;
      }
      const zero = rappen(0);
      lines.push({
        rawText: row,
        kind: 'discount',
        name,
        quantity: 1,
        unit: 'pcs',
        priceRappen: price,
        discountRappen: zero,
      });
      continue;
    }
    const kind = KEYWORDS.deposit.test(words)
      ? 'deposit'
      : KEYWORDS.bag.test(words)
        ? 'bag'
        : 'item';
    const rate = numbers.vatCode === undefined ? undefined : vatRates.get(numbers.vatCode);
    const line: ParsedReceiptLine = {
      rawText: row,
      kind,
      name,
      quantity: numbers.quantity ?? 1,
      unit: numbers.unit ?? 'pcs',
      ...(numbers.unitPrice === undefined ? {} : { unitPriceRappen: numbers.unitPrice }),
      priceRappen: numbers.price,
      discountRappen: numbers.discount,
      ...(rate === undefined || kind !== 'item' ? {} : { isFood: rate < 5 }),
    };
    lines.push(line);
    lastItem = kind === 'item' ? line : null;
  }

  const computedTotalRappen = sumRappen(
    lines.map((line) => rappen(line.priceRappen + line.discountRappen)),
  );
  const storeName = detectStore(rows);
  return {
    retailer: detectRetailer(rows),
    ...(storeName === undefined ? {} : { storeName }),
    ...detectDate(rows.join('\n')),
    lines,
    totalRappen,
    computedTotalRappen,
    sumCheck:
      totalRappen === null ? 'no-total' : totalRappen === computedTotalRappen ? 'ok' : 'mismatch',
  };
}
