import { z } from 'zod';
import { formatChf, parseChf, rappen, type Rappen } from './money';

/**
 * One currency per household (ADR-0019): amounts are integers in the smallest unit of that
 * currency (CHF: Rappen, EUR: cents, JPY: yen). The types keep the name `Rappen` until contract
 * v2. Formatting is deterministic and independent of the runtime's Intl data, like `formatChf`.
 */
export const CurrencyCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/)
  .brand<'CurrencyCode'>();
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

export const DEFAULT_CURRENCY = CurrencyCodeSchema.parse('CHF');

/** ISO 4217 minor units that differ from the usual two. */
const MINOR_DIGITS: Readonly<Record<string, number>> = {
  JPY: 0,
  KRW: 0,
  ISK: 0,
  CLP: 0,
  VND: 0,
  PYG: 0,
  UGX: 0,
  XAF: 0,
  XOF: 0,
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  TND: 3,
};

interface MoneyStyle {
  symbol: string;
  after: boolean;
  decimal: string;
  group: string;
}

/** How people write amounts in the pilot markets; everything else gets the code in front. */
const STYLES: Readonly<Record<string, MoneyStyle>> = {
  CHF: { symbol: 'CHF', after: false, decimal: '.', group: '’' },
  // Germany and Austria: «1.234,50 €».
  EUR: { symbol: '€', after: true, decimal: ',', group: '.' },
};

export function minorDigits(currency: CurrencyCode): number {
  return MINOR_DIGITS[currency] ?? 2;
}

function styleOf(currency: CurrencyCode): MoneyStyle {
  return STYLES[currency] ?? { symbol: currency, after: false, decimal: '.', group: '’' };
}

/** The symbol shown with amounts, e.g. `CHF` or `€`, for labels like «Preis in CHF». */
export function currencySymbol(currency: CurrencyCode): string {
  return styleOf(currency).symbol;
}

/**
 * Formats an amount in the smallest unit, e.g. `CHF 1’234.50`, `1.234,50 €`, `JPY 1’234`.
 * `currency: false` leaves out the symbol (for compact columns and input fields).
 */
export function formatMoney(
  amount: Rappen,
  currency: CurrencyCode,
  options: { currency?: boolean } = {},
): string {
  if (currency === DEFAULT_CURRENCY) {
    return formatChf(amount, options);
  }
  const { currency: withSymbol = true } = options;
  const style = styleOf(currency);
  const digits = minorDigits(currency);
  const factor = 10 ** digits;
  const absolute = Math.abs(amount);
  const whole = String(Math.trunc(absolute / factor)).replace(/\B(?=(\d{3})+(?!\d))/g, style.group);
  const fraction =
    digits === 0 ? '' : `${style.decimal}${String(absolute % factor).padStart(digits, '0')}`;
  const number = `${amount < 0 ? '-' : ''}${whole}${fraction}`;
  if (!withSymbol) {
    return number;
  }
  return style.after ? `${number} ${style.symbol}` : `${style.symbol} ${number}`;
}

/**
 * Reads a typed or printed amount in the household currency. CHF uses the Swiss receipt parser;
 * other currencies accept `.` or `,` as decimal mark: the last mark followed by exactly the
 * currency's decimals is the decimal mark, every other mark groups thousands («1.234,50»,
 * «1,234.50», «3,95», «12»). Returns null for anything ambiguous.
 */
export function parseMoney(input: string, currency: CurrencyCode): Rappen | null {
  if (currency === DEFAULT_CURRENCY) {
    return parseChf(input);
  }
  const style = styleOf(currency);
  let text = input.trim().replace(style.symbol, '').replace(currency, '').trim();
  let negative = false;
  if (/^[-\u2212]/.test(text)) {
    negative = true;
    text = text.slice(1).trim();
  }
  text = text.replace(/['\u2019\u2009\u202f ]/g, '');
  if (!/^\d[\d.,]*$/.test(text) && !/^[.,]\d+$/.test(text)) {
    return null;
  }
  const digits = minorDigits(currency);
  const last = Math.max(text.lastIndexOf('.'), text.lastIndexOf(','));
  const tail = last === -1 ? '' : text.slice(last + 1);
  const isDecimal = last !== -1 && digits > 0 && tail.length >= 1 && tail.length <= digits;
  const wholeText = (isDecimal ? text.slice(0, last) : text).replace(/[.,]/g, '');
  const fractionText = isDecimal ? tail.padEnd(digits, '0') : '';
  if (!isDecimal && last !== -1 && tail.length !== 3) {
    return null;
  }
  const total =
    Number.parseInt(wholeText === '' ? '0' : wholeText, 10) * 10 ** digits +
    (fractionText === '' ? 0 : Number.parseInt(fractionText, 10));
  if (!Number.isSafeInteger(total)) {
    return null;
  }
  return rappen(negative && total !== 0 ? -total : total);
}
