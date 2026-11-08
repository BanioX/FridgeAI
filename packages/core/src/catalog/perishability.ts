import { daysBetween } from '../dates';
import type { LocalDate } from '../model/primitives';
import type { Category } from './category';
import { categoryById } from './match';

/**
 * How quickly a food spoils (ADR-0038, Alban 8.11.2026: «Ein Eis oder ein Getränk geht nie
 * kaputt, aber ein Joghurt, eine Salatsauce, frisches Fleisch»):
 * - `high` (heikel): Verbrauchsdatum, or two weeks at most unopened at its best place;
 * - `medium` (mittel): up to two months;
 * - `low` (robust): longer, e.g. drinks, frozen food, pasta, an unopened sauce.
 * Rettich watches the delicate ones closely and leaves the robust ones alone.
 */
export type Perishability = 'high' | 'medium' | 'low';

const HIGH_MAX_DAYS = 14;
const MEDIUM_MAX_DAYS = 60;
/** A date this close needs a look, whatever the food. */
export const WATCH_AHEAD_DAYS = 7;

export function perishability(
  category: Pick<Category, 'dateKind' | 'shelfLifeDays'>,
): Perishability {
  if (category.dateKind === 'use_by') {
    return 'high';
  }
  // How long it keeps at its best place, unopened: apples keep longer in the fridge, juice in
  // the cupboard. Frozen food only counts when the freezer is its only place (ice cream).
  const { fridge, pantry, freezer } = category.shelfLifeDays;
  const unfrozen = [fridge, pantry].filter((days): days is number => days !== null);
  const days = unfrozen.length > 0 ? Math.max(...unfrozen) : freezer;
  if (days === null) {
    return 'medium';
  }
  return days <= HIGH_MAX_DAYS ? 'high' : days <= MEDIUM_MAX_DAYS ? 'medium' : 'low';
}

/**
 * Whether Rettich should ask about an item (fridge check): an open pack, a date within a week,
 * or a food that is not robust. An unknown category is watched, to be on the safe side.
 */
export function needsWatching(
  item: { categoryId: string; expiresOn: LocalDate; openedOn?: LocalDate | undefined },
  today: LocalDate,
): boolean {
  if (item.openedOn !== undefined || daysBetween(today, item.expiresOn) <= WATCH_AHEAD_DAYS) {
    return true;
  }
  const category = categoryById(item.categoryId);
  return category === undefined || perishability(category) !== 'low';
}
