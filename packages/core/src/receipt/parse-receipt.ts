import { localDate } from '../dates';
import { parseChf, rappen, sumRappen, type Rappen } from '../money';
import type { ReceiptLineKind } from '../model/receipt';
import type { LocalDate, Retailer } from '../model/primitives';

/** One line of a receipt as read from OCR text, before review (ADR-0027). */
export interface ParsedReceiptLine {
  rawText: string;
  kind: Extract<ReceiptLineKind, 'item' | 'discount' | 'deposit' | 'bag'>;
  name: string;
  /** Pieces for `pcs`, grams for `g` (weighed goods such as bananas). */
  quantity: number;
  unit: 'pcs' | 'g';
  /** Price per piece, or per kilogram for weighed goods. */
  unitPriceRappen?: Rappen;
  /** Amount printed on the line, before discounts. Negative for receipt-wide discounts. */
  priceRappen: Rappen;
  /** Discounts printed right below this line («Aktion», «Rabatt»), ≤ 0. */
  discountRappen: Rappen;
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
  /** Sum of the lines including discounts, deposit and bags. */
  computedTotalRappen: Rappen;
  /** Whether the lines add up to the printed total (OCR errors and missing lines show here). */
  sumCheck: 'ok' | 'mismatch' | 'no-total';
}

const RETAILERS: readonly Exclude<Retailer, 'other'>[] = [
  'migros',
  'coop',
  'aldi',
  'lidl',
  'denner',
];

const KEYWORDS = {
  total: /^(total|summe|gesamttotal|gesamtbetrag|endbetrag|zu bezahlen)\b/,
  subtotal: /\b(zwischensumme|zwischentotal|subtotal)\b/,
  // Before the total only; payment and VAT lines after it are never read.
  payment:
    /\b(bezahlt|zahlung|kartenzahlung|mastercard|visa|maestro|twint|postfinance|rueckgeld)\b/,
  other: /\b(mwst|mehrwertsteuer|tva|superpunkte|cumulus)\b/,
  deposit: /\b(pfand|depot|consigne|mehrweg)\b/,
  bag: /\b(tragtaschen?|einkaufstaschen?|papiertragtaschen?|papiersack|plastiksack|tragsack|tuete)\b/,
  wideDiscount: /\b(einkauf|gutschein|alles|gesamt|treuerabatt|mitarbeiterrabatt|bonus)\b/,
};

const AMOUNT = /^-?\d{1,4}\.\d{2}-?$/;
const VAT_CODE = /^[0-9A-D]$/;
const WEIGHT_KG = /^(\d{1,3}\.\d{3})(?:kg)?$/;

function plain(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim();
}

/**
 * Cleans one OCR line: one kind of minus, single spaces, and typical OCR slips inside amounts
 * («l.95» → «1.95», «3,95» → «3.95», «1O.50» → «10.50», «3 .95» → «3.95»).
 */
export function normalizeReceiptLine(raw: string): string {
  return raw
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(\d) ?([.,]) ?(\d{2,3})(?![\d])/g, '$1$2$3')
    .replace(
      /(?<![\p{L}])[\dOolI|]*\d[\dOolI|]*[.,][\dOo]{2,3}-?(?![\p{L}])|(?<![\p{L}])[OolI|][.,]\d{2}-?(?![\p{L}])/gu,
      (token) => token.replace(/[Oo]/g, '0').replace(/[lI|]/g, '1').replace(',', '.'),
    );
}

interface LineNumbers {
  name: string;
  total: Rappen | null;
  quantity?: number;
  unit?: 'pcs' | 'g';
  unitPrice?: Rappen;
}

/** Splits «Butterweggli 2 x 1.40 2.80 1» into name, quantity, unit price and line total. */
function readNumbers(line: string): LineNumbers {
  const tokens = line.split(' ');
  if (tokens.length > 1 && VAT_CODE.test(tokens.at(-1) ?? '') && AMOUNT.test(tokens.at(-2) ?? '')) {
    tokens.pop();
  }
  const last = tokens.at(-1) ?? '';
  if (!AMOUNT.test(last)) {
    return { name: line, total: null };
  }
  tokens.pop();
  const total = parseChf(last);
  if (total === null) {
    return { name: line, total: null };
  }
  const rest = tokens.filter((token) => !/^(x|×|à|@|chf|\/kg|kg)$/i.test(token));
  const price = rest.at(-1);
  const amount = rest.at(-2);
  const unitPrice = price !== undefined && AMOUNT.test(price) ? parseChf(price) : null;
  if (unitPrice !== null && amount !== undefined) {
    const weight = WEIGHT_KG.exec(amount);
    if (weight?.[1] !== undefined) {
      const grams = Math.round(Number(weight[1]) * 1000);
      if (Math.abs(Math.round((grams * unitPrice) / 1000) - total) <= 1) {
        const name = rest.slice(0, -2).join(' ');
        return { name, total, quantity: grams, unit: 'g', unitPrice };
      }
    }
    const pieces = /^(\d{1,2})x?$/i.exec(amount);
    if (pieces?.[1] !== undefined && Number(pieces[1]) * unitPrice === total) {
      const name = rest.slice(0, -2).join(' ');
      return { name, total, quantity: Number(pieces[1]), unit: 'pcs', unitPrice };
    }
  }
  return { name: rest.join(' '), total };
}

function detectRetailer(lines: readonly string[]): Retailer {
  const head = lines.slice(0, 8).map(plain).join(' ');
  const all = lines.map(plain).join(' ');
  for (const text of [head, all]) {
    const found = RETAILERS.find((retailer) => new RegExp(`\\b${retailer}\\b`).test(text));
    if (found !== undefined) {
      return found;
    }
  }
  return 'other';
}

function detectDate(text: string): { purchasedOn?: LocalDate; purchasedTime?: string } {
  const match = /\b(\d{2})\.(\d{2})\.(\d{4}|\d{2})\b(?:\s+(\d{2}):(\d{2}))?/.exec(text);
  if (match === null) {
    return {};
  }
  const [, day, month, year = '', hours, minutes] = match;
  try {
    const purchasedOn = localDate(`${year.length === 2 ? `20${year}` : year}-${month}-${day}`);
    const time =
      hours !== undefined && minutes !== undefined && Number(hours) < 24 && Number(minutes) < 60
        ? `${hours}:${minutes}`
        : undefined;
    return { purchasedOn, ...(time === undefined ? {} : { purchasedTime: time }) };
  } catch {
    return {};
  }
}

/**
 * Reads a receipt from OCR text (ADR-0027): items with quantity, unit price and weight, discounts
 * folded into the item above them, deposit and bags, the printed total and a sum check. The
 * retailer-specific parsers refine this once real receipts are available; this one is the fallback.
 */
export function parseReceiptText(text: string): ParsedReceipt {
  const rows = text
    .split(/\r?\n/)
    .map(normalizeReceiptLine)
    .filter((row) => row !== '');
  const lines: ParsedReceiptLine[] = [];
  let totalRappen: Rappen | null = null;
  let pendingName = '';
  let lastItem: ParsedReceiptLine | null = null;
  let afterSubtotal = false;

  for (const row of rows) {
    const numbers = readNumbers(row);
    const words = plain(numbers.name);
    if (KEYWORDS.total.test(words) && numbers.total !== null) {
      totalRappen = numbers.total;
      break;
    }
    if (numbers.total === null) {
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
    if (numbers.total < 0) {
      if (lastItem !== null && !afterSubtotal && !KEYWORDS.wideDiscount.test(words)) {
        lastItem.discountRappen = rappen(lastItem.discountRappen + numbers.total);
        continue;
      }
      lines.push({
        rawText: row,
        kind: 'discount',
        name,
        quantity: 1,
        unit: 'pcs',
        priceRappen: numbers.total,
        discountRappen: rappen(0),
      });
      continue;
    }
    const kind = KEYWORDS.deposit.test(words)
      ? 'deposit'
      : KEYWORDS.bag.test(words)
        ? 'bag'
        : 'item';
    const line: ParsedReceiptLine = {
      rawText: row,
      kind,
      name,
      quantity: numbers.quantity ?? 1,
      unit: numbers.unit ?? 'pcs',
      ...(numbers.unitPrice === undefined ? {} : { unitPriceRappen: numbers.unitPrice }),
      priceRappen: numbers.total,
      discountRappen: rappen(0),
    };
    lines.push(line);
    lastItem = kind === 'item' ? line : null;
  }

  const computedTotalRappen = sumRappen(
    lines.map((line) => rappen(line.priceRappen + line.discountRappen)),
  );
  const storeLine = rows
    .slice(0, 6)
    .find((row) => readNumbers(row).total === null && detectRetailer([row]) !== 'other');
  return {
    retailer: detectRetailer(rows),
    ...(storeLine === undefined ? {} : { storeName: storeLine.slice(0, 80) }),
    ...detectDate(rows.join('\n')),
    lines,
    totalRappen,
    computedTotalRappen,
    sumCheck:
      totalRappen === null ? 'no-total' : totalRappen === computedTotalRappen ? 'ok' : 'mismatch',
  };
}
