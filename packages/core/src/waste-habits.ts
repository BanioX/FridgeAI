import { categoryById, fallbackCategory } from './catalog/match';
import { toLocalDate } from './dates';
import type { LocalDate } from './model/primitives';

/** Thrown away this often within the window, a category counts as a habit. */
export const WASTE_HABIT_MIN_TIMES = 2;
/** Habits change, and old data should fade (ADR-0020): three months are enough. */
export const WASTE_HABIT_DAYS = 90;

export interface WasteHabit {
  categoryId: string;
  /** How often something of this category was thrown away in the window. */
  times: number;
  /** The product names, most recent first, without repeats. */
  names: string[];
  lastOn: LocalDate;
  /** The category's first tip: the smaller pack, the tube, freezing in portions. */
  tip?: string | undefined;
}

/**
 * «Das wirfst du oft weg» (ADR-0038, Alban 8.11.2026: «Guacamole, Hummus, Mayonnaise oder
 * Tomatenmark, die typischen mal gekauft, nie gebraucht»): categories thrown away at least twice
 * in the window, most often first. Only the household's own data, computed on the device.
 */
export function wasteHabits(input: {
  outcomes: readonly {
    itemId: string;
    outcome: 'eaten' | 'shared_out' | 'wasted';
    at: string;
    deletedAt?: string | undefined;
  }[];
  /** Product name and category per item. */
  itemInfo: (itemId: string) => { name: string; categoryId: string } | undefined;
  since: string;
  minTimes?: number;
}): WasteHabit[] {
  const minTimes = input.minTimes ?? WASTE_HABIT_MIN_TIMES;
  const wasted = input.outcomes
    .filter(
      (outcome) =>
        outcome.outcome === 'wasted' &&
        outcome.deletedAt === undefined &&
        outcome.at >= input.since,
    )
    .sort((a, b) => b.at.localeCompare(a.at));
  const byCategory = new Map<string, WasteHabit>();
  for (const outcome of wasted) {
    const info = input.itemInfo(outcome.itemId);
    const category = categoryById(info?.categoryId ?? '') ?? fallbackCategory();
    const name = info?.name ?? category.name.de;
    const habit = byCategory.get(category.id);
    if (habit === undefined) {
      const tip = category.tips.de[0];
      byCategory.set(category.id, {
        categoryId: category.id,
        times: 1,
        names: [name],
        lastOn: toLocalDate(outcome.at),
        ...(tip === undefined ? {} : { tip }),
      });
    } else {
      habit.times += 1;
      if (!habit.names.includes(name)) {
        habit.names.push(name);
      }
    }
  }
  return [...byCategory.values()]
    .filter((habit) => habit.times >= minTimes)
    .sort((a, b) => b.times - a.times || b.lastOn.localeCompare(a.lastOn));
}
