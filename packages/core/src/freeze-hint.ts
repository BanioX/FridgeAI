import { categoryById, fallbackCategory } from './catalog/match';
import { isFreezable } from './catalog/category';

/** What the freeze hint needs to know about an item. */
export interface FreezeCandidate {
  id: string;
  categoryId: string;
}

export interface FreezeAdvice<T extends FreezeCandidate> {
  /** Food that freezes well: moves without asking. */
  suitable: T[];
  /** Food the catalog marks as not freezable, each with the reason for its category. */
  unsuitable: { item: T; note: string | undefined }[];
}

/**
 * Before a move into the freezer: which items need the calm hint «Eignet sich nicht zum
 * Einfrieren» (catalog freezer days `null`) and why. `note` is the category's `freezeNote`;
 * without one the screen shows its general sentence. Pure, so every way into the freezer (item
 * page, selection bar, drag onto the tab) decides the same.
 */
export function adviseFreezing<T extends FreezeCandidate>(items: readonly T[]): FreezeAdvice<T> {
  const advice: FreezeAdvice<T> = { suitable: [], unsuitable: [] };
  for (const item of items) {
    const category = categoryById(item.categoryId) ?? fallbackCategory();
    if (isFreezable(category)) {
      advice.suitable.push(item);
    } else {
      advice.unsuitable.push({ item, note: category.freezeNote?.de });
    }
  }
  return advice;
}
