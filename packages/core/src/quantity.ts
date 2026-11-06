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

export interface PortionChoice {
  /** `quarter`, `half`, `three_quarters`, `all`, or `pieces` for whole pieces. */
  kind: 'quarter' | 'half' | 'three_quarters' | 'all' | 'pieces';
  /** Amount consumed in the item's base unit. */
  quantity: number;
}

/** Below this many grams or millilitres, fractions are pointless: only «alles». */
const MIN_FRACTION_AMOUNT = 20;

/**
 * Quick choices for «how much was used?» (S-05): «1 von 4» for several whole pieces,
 * ¼ · ½ · ¾ · alles for grams, millilitres and a single piece.
 */
export function portionChoices(quantity: number, unit: Unit): PortionChoice[] {
  const all: PortionChoice = { kind: 'all', quantity };
  if (unit === 'pcs' && Number.isInteger(quantity) && quantity >= 2) {
    const pieces = Array.from({ length: Math.min(quantity - 1, 5) }, (_, index) => ({
      kind: 'pieces' as const,
      quantity: index + 1,
    }));
    return [...pieces, all];
  }
  if (unit !== 'pcs' && quantity < MIN_FRACTION_AMOUNT) {
    return [all];
  }
  const decimals = unit === 'pcs' ? 2 : 0;
  const fractions: PortionChoice[] = [
    { kind: 'quarter', quantity: round(quantity * 0.25, decimals) },
    { kind: 'half', quantity: round(quantity * 0.5, decimals) },
    { kind: 'three_quarters', quantity: round(quantity * 0.75, decimals) },
  ];
  return [...fractions.filter((choice) => choice.quantity > 0 && choice.quantity < quantity), all];
}
