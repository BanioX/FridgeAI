import type { Nutrition } from '@fridgeai/core';

/** The four steps of an article card, in the order the person works through them. */
export const STEP_KEYS = ['product', 'date', 'place', 'price'] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export interface StepFacts {
  /** Packed food is asked about; loose produce and weighed goods have no barcode to confirm. */
  asksProduct: boolean;
  /** «Ja» was chosen, a barcode was scanned or the hit is known from an earlier receipt. */
  productConfirmed: boolean;
  /** The person picked or typed a date; keeping the category estimate does not count. */
  datePicked: boolean;
}

/** Place and price come prefilled (category location, price read) and count as done. */
export function stepsDone(facts: StepFacts): Record<StepKey, boolean> {
  return {
    product: !facts.asksProduct || facts.productConfirmed,
    date: facts.datePicked,
    place: true,
    price: true,
  };
}

export const doneCount = (done: Record<StepKey, boolean>) =>
  STEP_KEYS.filter((key) => done[key]).length;

export const isComplete = (done: Record<StepKey, boolean>) => doneCount(done) === STEP_KEYS.length;

/**
 * The card to open after `current`: the next incomplete one in list order, else the first
 * incomplete one before it. `null` when every card is complete.
 */
export function nextIncomplete(
  order: readonly number[],
  current: number | null,
  complete: (index: number) => boolean,
): number | null {
  const start = current === null ? -1 : order.indexOf(current);
  const ahead = order.slice(start + 1).find((index) => !complete(index));
  return ahead ?? order.find((index) => index !== current && !complete(index)) ?? null;
}

const oneDecimal = (value: number) => String(Math.round(value * 10) / 10);

type FactKey = 'kcal' | 'fat' | 'sugars' | 'salt';

/** Key values per 100 g/ml that are known, in the order energy, fat, sugars, salt. */
export function nutritionFacts(
  nutrition: Nutrition | undefined,
): { basis: Nutrition['basis']; values: { key: FactKey; text: string }[] } | null {
  if (nutrition === undefined) {
    return null;
  }
  const values: { key: FactKey; text: string }[] = [];
  if (nutrition.energyKcal !== undefined) {
    values.push({ key: 'kcal', text: String(Math.round(nutrition.energyKcal)) });
  }
  if (nutrition.fat !== undefined) {
    values.push({ key: 'fat', text: oneDecimal(nutrition.fat) });
  }
  if (nutrition.sugars !== undefined) {
    values.push({ key: 'sugars', text: oneDecimal(nutrition.sugars) });
  }
  if (nutrition.salt !== undefined) {
    values.push({ key: 'salt', text: oneDecimal(nutrition.salt) });
  }
  return values.length === 0 ? null : { basis: nutrition.basis, values };
}
