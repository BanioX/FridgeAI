import { matchCategoryByName } from '../catalog/match';

/** What `shoppingTips` needs of a list entry. */
export interface TipEntry {
  id: string;
  name: string;
  checked: boolean;
  categoryId?: string | undefined;
}

/** What `shoppingTips` needs of a waste habit (see `WasteHabit`). */
export interface TipHabit {
  categoryId: string;
  tip?: string | undefined;
}

/** A calm hint for one list entry: the category is one the household often throws away (K5). */
export interface ShoppingTip {
  categoryId: string;
  /** The category's own tip, if it has one; the page falls back to a general one. */
  tip?: string | undefined;
}

/**
 * «Mengen-Tipp» on the shopping list (K5): for each open entry whose category is a waste habit,
 * the habit's tip. The entry's own category wins, else the name matcher decides. Checked entries
 * and entries without a habit get nothing. Keyed by entry id.
 */
export function shoppingTips(input: {
  entries: readonly TipEntry[];
  habits: readonly TipHabit[];
}): Map<string, ShoppingTip> {
  const byCategory = new Map(input.habits.map((habit) => [habit.categoryId, habit]));
  const tips = new Map<string, ShoppingTip>();
  if (byCategory.size === 0) {
    return tips;
  }
  for (const entry of input.entries) {
    if (entry.checked) {
      continue;
    }
    const categoryId = entry.categoryId ?? matchCategoryByName(entry.name)?.id;
    const habit = categoryId === undefined ? undefined : byCategory.get(categoryId);
    if (categoryId !== undefined && habit !== undefined) {
      tips.set(entry.id, {
        categoryId,
        ...(habit.tip === undefined ? {} : { tip: habit.tip }),
      });
    }
  }
  return tips;
}
