import { expiryStatus, type DateKind, type Id, type LocalDate, type Unit } from '@fridgeai/core';

/** A food at home that a recipe used, as `recipes.get` returns it. */
export interface UsedFood {
  itemId: Id;
  name: string;
  quantity: number;
  unit: Unit;
  expiresOn: LocalDate;
  expiryKind: DateKind;
}

export type CookedChoice = 'all' | 'half' | 'none';

/** Each food once, even when two ingredients match it (eggs for the dough and the topping). */
export function usedFood(ingredients: readonly { atHome: readonly UsedFood[] }[]): UsedFood[] {
  const byId = new Map<Id, UsedFood>();
  for (const ingredient of ingredients) {
    for (const food of ingredient.atHome) {
      byId.set(food.itemId, food);
    }
  }
  return [...byId.values()];
}

/**
 * What to preselect after cooking (ADR-0023): food that had to be rescued (today, within three
 * days or past best-before) is likely used up, «Alles»; fresh food usually only partly, «Nichts»,
 * so a recipe with 3 eggs does not book a whole box of 10.
 */
export function defaultChoice(food: UsedFood, today: LocalDate): CookedChoice {
  const status = expiryStatus(food.expiresOn, today, food.expiryKind);
  return status.kind === 'fresh' ? 'none' : 'all';
}
