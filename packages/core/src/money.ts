import { z } from 'zod';
import { groupThousands } from './format';

/**
 * Money in rettich is always an integer number of Rappen (1 CHF = 100 Rappen).
 * Never use floats for amounts (see ADR-0004).
 */
export const RappenSchema = z.int().brand<'Rappen'>();
export type Rappen = z.infer<typeof RappenSchema>;

/** Brands a safe integer as Rappen. Throws on fractions, NaN and unsafe integers. */
export function rappen(value: number): Rappen {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Rappen must be a safe integer, got ${String(value)}`);
  }
  return value as Rappen;
}

export const ZERO_RAPPEN = rappen(0);

export function sumRappen(values: readonly Rappen[]): Rappen {
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return rappen(total);
}

const CURRENCY_PREFIX = /^(?:chf|sfr\.?|fr\.?)\s*/i;
const CURRENCY_SUFFIX = /\s*(?:chf|fr\.?)$/i;
// Thousands separators used in Switzerland: ' ’ ʼ and (thin) spaces between digits.
const THOUSANDS_SEPARATOR = /(?<=\d)['\u2019\u02bc\u2009\u202f ](?=\d{3}(?:\D|$))/g;
const AMOUNT = /^(?<francs>\d*)(?:[.,](?<cents>\d{1,2}|[-–—]))?$/;

/**
 * Parses a Swiss franc amount as printed on receipts or typed by people.
 * Accepts e.g. `3.95`, `3,95`, `-.95`, `.95`, `1'234.50`, `CHF 12.–`, `12.-`, `12`, `0.80-`, `−3.95`.
 * Returns null for anything that is not an unambiguous amount (e.g. three decimals).
 */
export function parseChf(input: string): Rappen | null {
  let text = input.trim();
  let negative = false;
  // A sign may come before or after the currency: "-CHF 3.95" and "CHF -3.95".
  if (/^[-−]/.test(text)) {
    negative = true;
    text = text.slice(1).trim();
  }
  text = text.replace(CURRENCY_PREFIX, '').replace(CURRENCY_SUFFIX, '').trim();
  if (!negative && /^[-−]/.test(text)) {
    negative = true;
    text = text.slice(1).trim();
  } else if (!negative && /\d-$/.test(text)) {
    // Discounts on some receipts carry a trailing minus: "0.80-".
    negative = true;
    text = text.slice(0, -1);
  }

  text = text.replace(THOUSANDS_SEPARATOR, '');
  const match = AMOUNT.exec(text);
  const francsText = match?.groups?.francs;
  const centsText = match?.groups?.cents;
  if (francsText === undefined || (francsText === '' && centsText === undefined)) {
    return null;
  }

  const francs = francsText === '' ? 0 : Number.parseInt(francsText, 10);
  let cents = 0;
  if (centsText !== undefined && !/^[-–—]$/.test(centsText)) {
    cents = Number.parseInt(centsText.padEnd(2, '0'), 10);
  }

  const total = francs * 100 + cents;
  if (!Number.isSafeInteger(total)) {
    return null;
  }
  return rappen(negative && total !== 0 ? -total : total);
}

/**
 * Formats Rappen as Swiss francs, e.g. `CHF 1’234.50`, `CHF -3.95`.
 * Deterministic and independent of the runtime's Intl data.
 */
export function formatChf(amount: Rappen, options: { currency?: boolean } = {}): string {
  const { currency = true } = options;
  const sign = amount < 0 ? '-' : '';
  const absolute = Math.abs(amount);
  const francs = Math.trunc(absolute / 100);
  const cents = absolute % 100;
  const number = `${sign}${groupThousands(String(francs))}.${String(cents).padStart(2, '0')}`;
  return currency ? `CHF ${number}` : number;
}

/**
 * Splits `total` into integer shares proportional to integer `weights` (largest remainder method).
 *
 * Guarantees: the shares sum exactly to `total`; every share differs from its exact proportional
 * value by less than one Rappen; zero weights get zero. Ties for the leftover Rappen go to the
 * lowest index starting at `offset`, so callers can rotate who receives the extra Rappen.
 */
export function allocate(
  total: Rappen,
  weights: readonly number[],
  options: { offset?: number } = {},
): Rappen[] {
  if (weights.length === 0) {
    throw new RangeError('allocate needs at least one weight');
  }
  let weightSum = 0;
  for (const weight of weights) {
    if (!Number.isSafeInteger(weight) || weight < 0) {
      throw new RangeError(`Weights must be non-negative safe integers, got ${String(weight)}`);
    }
    weightSum += weight;
  }
  if (weightSum === 0) {
    throw new RangeError('allocate needs at least one positive weight');
  }

  const sign = total < 0 ? -1 : 1;
  const absolute = Math.abs(total);
  if (!Number.isSafeInteger(absolute * weightSum)) {
    throw new RangeError('allocate: total × weights exceeds the safe integer range');
  }
  const shares = weights.map((weight) => Math.floor((absolute * weight) / weightSum));
  const remainders = weights.map((weight) => (absolute * weight) % weightSum);
  let leftover = absolute - shares.reduce((sum, share) => sum + share, 0);

  const count = weights.length;
  const offset = (((options.offset ?? 0) % count) + count) % count;
  const order = Array.from({ length: count }, (_, i) => (i + offset) % count)
    .filter((index) => (weights[index] ?? 0) > 0)
    .sort((a, b) => (remainders[b] ?? 0) - (remainders[a] ?? 0));

  for (const index of order) {
    if (leftover === 0) {
      break;
    }
    shares[index] = (shares[index] ?? 0) + 1;
    leftover -= 1;
  }

  // Avoid -0 for zero shares of negative totals.
  return shares.map((share) => rappen(share === 0 ? 0 : sign * share));
}

/** Splits `total` into `parts` shares that differ by at most one Rappen. */
export function splitEvenly(
  total: Rappen,
  parts: number,
  options: { offset?: number } = {},
): Rappen[] {
  if (!Number.isSafeInteger(parts) || parts < 1) {
    throw new RangeError(`parts must be a positive integer, got ${String(parts)}`);
  }
  return allocate(
    total,
    Array.from({ length: parts }, () => 1),
    options,
  );
}
