import { daysBetween } from '../dates';
import type { LocalDate } from '../model/primitives';
import type { Category } from './category';
import { categoryById } from './match';

/**
 * How quickly a food spoils (ADR-0038, Alban 8.11.2026: «Ein Eis oder ein Getränk geht nie
 * kaputt, aber ein Joghurt, eine Salatsauce, frisches Fleisch»): heikel, mittel or robust.
 */
export type Perishability = 'high' | 'medium' | 'low';

/** A date this close needs a look, whatever the food. */
export const WATCH_AHEAD_DAYS = 7;

/**
 * Upper day limits of the scores 1 to 9; longer is 10 (Alban, 8.11.2026: «Score von 1 bis 10»,
 * Haltbarkeit, 10 = hält am längsten). Roughly doubling steps: two days, four, a week, two
 * weeks, a month, two months, half a year, a year, three years.
 */
const SCORE_MAX_DAYS = [2, 4, 7, 14, 30, 60, 180, 365, 1095] as const;
/** With a Verbrauchsdatum the score never goes above this: no «schauen, riechen, probieren». */
const USE_BY_MAX_SCORE = 3;

/** Score 1 to 10 for a number of days. */
export function scoreForDays(days: number): number {
  const index = SCORE_MAX_DAYS.findIndex((max) => days <= max);
  return index === -1 ? 10 : index + 1;
}

/** How long it keeps unopened at its best place; null if the catalog knows no place. */
function bestDays(category: Pick<Category, 'shelfLifeDays'>): number | null {
  // Apples keep longer in the fridge, juice in the cupboard. Frozen food only counts when the
  // freezer is its only place (ice cream).
  const { fridge, pantry, freezer } = category.shelfLifeDays;
  const unfrozen = [fridge, pantry].filter((days): days is number => days !== null);
  return unfrozen.length > 0 ? Math.max(...unfrozen) : freezer;
}

/**
 * Haltbarkeit from 1 (Hackfleisch, two days) to 10 (Notvorrat). An open pack scores by its days
 * after opening: Hummus drops to 2, Tomatenmark to 3, Mayonnaise to 5.
 */
export function shelfScore(
  category: Pick<Category, 'dateKind' | 'shelfLifeDays' | 'afterOpeningDays'>,
  options: { opened?: boolean } = {},
): number {
  const sealed = bestDays(category);
  const opened = options.opened === true ? category.afterOpeningDays : undefined;
  const days = opened === undefined ? sealed : sealed === null ? opened : Math.min(sealed, opened);
  const score = days === null ? 5 : scoreForDays(days);
  return category.dateKind === 'use_by' ? Math.min(score, USE_BY_MAX_SCORE) : score;
}

/**
 * The three levels are ranges of the score (ADR-0038): heikel 1–4 (two weeks at most), mittel
 * 5–6 (up to two months), robust 7–10. Rettich watches the delicate ones closely and leaves the
 * robust ones alone.
 */
export function perishabilityOf(score: number): Perishability {
  return score <= 4 ? 'high' : score <= 6 ? 'medium' : 'low';
}

/** The level of a category, unopened. */
export function perishability(
  category: Pick<Category, 'dateKind' | 'shelfLifeDays' | 'afterOpeningDays'>,
): Perishability {
  return perishabilityOf(shelfScore(category));
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
