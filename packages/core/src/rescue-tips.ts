import { isFreezable } from './catalog/category';
import { categoryById } from './catalog/match';
import { daysBetween } from './dates';
import type { DateKind, LocalDate, StorageLocation } from './model/primitives';

/**
 * «Ist das noch gut?» (K3): a best-before date (MHD) is a quality promise, not a safety limit, so
 * before such food is thrown away Rettich reminds the person to look, smell and taste. A use-by
 * date (Verbrauchsdatum) is a safety limit and never gets the hint.
 */
export function shouldAskStillGood(item: { expiryKind: DateKind }): boolean {
  return item.expiryKind === 'best_before';
}

/**
 * «Einfrieren mit einem Tipp» (K4): suggest freezing for food in the fridge whose category can be
 * frozen and whose date is today or tomorrow. Past dates get no tip (too late for a rescue), and
 * neither do the freezer, the pantry and the Notvorrat.
 */
export function shouldSuggestFreezing(
  item: { location: StorageLocation; categoryId: string; expiresOn: LocalDate },
  today: LocalDate,
): boolean {
  if (item.location !== 'fridge') {
    return false;
  }
  const category = categoryById(item.categoryId);
  if (category === undefined || !isFreezable(category)) {
    return false;
  }
  const daysLeft = daysBetween(today, item.expiresOn);
  return daysLeft === 0 || daysLeft === 1;
}
