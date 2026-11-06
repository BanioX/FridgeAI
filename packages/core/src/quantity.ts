import { DEFAULT_PORTIONING } from './catalog/category';
import type { PackageSize, Unit } from './model/primitives';

/** Units people type or read; stored as base units g, ml or pcs (ADR-0011). */
export type InputUnit = 'g' | 'kg' | 'ml' | 'cl' | 'dl' | 'l' | 'pcs';

const FACTORS: Record<InputUnit, { unit: Unit; factor: number }> = {
  g: { unit: 'g', factor: 1 },
  kg: { unit: 'g', factor: 1000 },
  ml: { unit: 'ml', factor: 1 },
  cl: { unit: 'ml', factor: 10 },
  dl: { unit: 'ml', factor: 100 },
  l: { unit: 'ml', factor: 1000 },
  pcs: { unit: 'pcs', factor: 1 },
};

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/** «1.5 kg» → 1500 g, «3 dl» → 300 ml. */
export function toBaseQuantity(amount: number, unit: InputUnit): { quantity: number; unit: Unit } {
  const { unit: base, factor } = FACTORS[unit];
  return { quantity: round(amount * factor, 6), unit: base };
}

export type DisplayUnit = InputUnit;

/**
 * The natural unit to show a quantity in: 1500 g → 1.5 kg, 300 ml → 3 dl (Swiss usage),
 * 330 ml → 330 ml, 1500 ml → 1.5 l, pieces stay pieces. Formatting with words is the UI's job.
 */
export function displayQuantity(
  quantity: number,
  unit: Unit,
): { amount: number; unit: DisplayUnit } {
  if (unit === 'g') {
    return quantity >= 1000
      ? { amount: round(quantity / 1000, 2), unit: 'kg' }
      : { amount: round(quantity, 0), unit: 'g' };
  }
  if (unit === 'ml') {
    if (quantity >= 1000) {
      return { amount: round(quantity / 1000, 2), unit: 'l' };
    }
    if (quantity >= 100 && quantity % 100 === 0) {
      return { amount: quantity / 100, unit: 'dl' };
    }
    return { amount: round(quantity, 0), unit: 'ml' };
  }
  return { amount: round(quantity, 2), unit: 'pcs' };
}

/** Weight in grams if it can be known: grams directly, ml ≈ g, pieces via package size. */
export function knownGrams(
  quantity: number,
  unit: Unit,
  packageSize?: PackageSize,
): number | undefined {
  if (unit !== 'pcs') {
    return Math.round(quantity);
  }
  return packageSize === undefined ? undefined : Math.round(quantity * packageSize.amount);
}

/** A fraction in lowest terms, e.g. 1/3. */
export interface Fraction {
  numerator: number;
  denominator: number;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * The fractions below 1 that the given denominators offer, in lowest terms and ascending:
 * [3, 4] → ¼ ⅓ ½ ⅔ ¾. Denominators above 4 only add their unit fraction ([8] → ⅛, not ⅜).
 */
export function fractionsFor(splits: readonly number[]): Fraction[] {
  const fractions = new Map<string, Fraction>();
  for (const denominator of splits) {
    const largest = denominator <= 4 ? denominator - 1 : 1;
    for (let numerator = 1; numerator <= largest; numerator += 1) {
      const divisor = gcd(numerator, denominator);
      const fraction = { numerator: numerator / divisor, denominator: denominator / divisor };
      fractions.set(`${String(fraction.numerator)}/${String(fraction.denominator)}`, fraction);
    }
  }
  return [...fractions.values()].sort(
    (a, b) => a.numerator / a.denominator - b.numerator / b.denominator,
  );
}

/** One quick choice for «how much was used?»; `quantity` is in the item's base unit. */
export type PortionChoice =
  /** g/ml: a fraction of what is left (¼ of 400 g = 100 g); pieces: a fraction of one piece. */
  | ({ kind: 'fraction'; quantity: number } & Fraction)
  | { kind: 'pieces'; count: number; quantity: number }
  | { kind: 'all'; quantity: number };

/** Below this many grams or millilitres, fractions are pointless: only «alles». */
const MIN_FRACTION_AMOUNT = 20;
/** At most this many «N Stück» choices; larger amounts go through free input. */
const MAX_PIECE_CHOICES = 5;

/**
 * Quick choices for «how much was used?» (S-05). `splits` comes from the category
 * (`portioningOf(category).splits`): a cake offers ⅛ ¼ ½ ¾, a hard cheese ¼ ⅓ ½ ⅔ ¾, eggs none.
 * - g/ml: fractions of what is left, or only «alles» below 20 g/ml.
 * - Pieces: «1 · 2 · 3 Stück» while more than one piece is left, fractions of one piece while
 *   less than two are left (half a loaf, ⅛ of the last cake), always «alles» last.
 * Free input stays available in the UI for anything else.
 */
export function portionChoices(
  quantity: number,
  unit: Unit,
  splits: readonly number[] = DEFAULT_PORTIONING.splits,
): PortionChoice[] {
  const all: PortionChoice = { kind: 'all', quantity };
  const fractions = fractionsFor(splits);
  if (unit !== 'pcs') {
    if (quantity < MIN_FRACTION_AMOUNT) {
      return [all];
    }
    const parts = fractions
      .map((fraction) => ({
        kind: 'fraction' as const,
        ...fraction,
        quantity: round((quantity * fraction.numerator) / fraction.denominator, 0),
      }))
      .filter((choice) => choice.quantity > 0 && choice.quantity < quantity)
      // Rounded to whole grams, two fractions of a small amount can land on the same value.
      .filter((choice, index, list) => choice.quantity !== list[index - 1]?.quantity);
    return [...parts, all];
  }
  const parts =
    quantity < 2
      ? fractions
          .map((fraction) => ({
            kind: 'fraction' as const,
            ...fraction,
            quantity: round(fraction.numerator / fraction.denominator, 4),
          }))
          .filter((choice) => choice.quantity < quantity)
      : [];
  const wholePieces = Math.min(Math.ceil(quantity) - 1, MAX_PIECE_CHOICES);
  const pieces = Array.from({ length: Math.max(wholePieces, 0) }, (_, index) => ({
    kind: 'pieces' as const,
    count: index + 1,
    quantity: index + 1,
  }));
  return [...parts, ...pieces, all];
}
