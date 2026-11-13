import { formatDecimal, type Unit } from '@fridgeai/core';

/**
 * The values of the amount wheel (ADR-0083) for grams or millilitres up to `max`: steps people
 * weigh in (5 below 100, 10 below 1000, 50 above), and `max` itself as the last stop even when it
 * is no multiple of the step («alles»).
 */
export function wheelValues(max: number): number[] {
  if (max <= 0) {
    return [];
  }
  const step = max <= 100 ? 5 : max <= 1000 ? 10 : 50;
  const values: number[] = [];
  for (let value = step; value < max; value += step) {
    values.push(value);
  }
  values.push(Math.round(max * 100) / 100);
  return values;
}

/** The stop nearest to `wanted`, so a typed or old value lands on the wheel. */
export function nearestIndex(values: readonly number[], wanted: number): number {
  let best = 0;
  values.forEach((value, index) => {
    if (Math.abs(value - wanted) < Math.abs((values[best] ?? 0) - wanted)) {
      best = index;
    }
  });
  return best;
}

/**
 * A stop as people read it on the wheel: grams up to a kilo, then kilos; millilitres up to a
 * litre, then litres (no decilitres here: Alban, 13.11.2026). Pieces as a plain number.
 */
export function wheelText(value: number, unit: Unit): string {
  if (unit === 'g') {
    return value >= 1000 ? `${formatDecimal(value / 1000)} kg` : `${formatDecimal(value)} g`;
  }
  if (unit === 'ml') {
    return value >= 1000 ? `${formatDecimal(value / 1000)} l` : `${formatDecimal(value)} ml`;
  }
  return formatDecimal(value);
}
