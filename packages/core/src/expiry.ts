import type { Category } from './catalog/category';
import { addDays, daysBetween, minLocalDate } from './dates';
import type { DateKind, LocalDate, StorageLocation } from './model/primitives';

/** Items expiring within this many days count as «läuft bald ab». */
export const SOON_THRESHOLD_DAYS = 3;

/** Thawed food keeps at most this many days; use-by food (meat, fish) only one. */
const THAWED_MAX_DAYS = 2;
const THAWED_USE_BY_DAYS = 1;

export type ExpiryStatus =
  | { kind: 'fresh'; daysLeft: number }
  | { kind: 'soon'; daysLeft: number }
  | { kind: 'today' }
  /** MHD passed: often still good – look, smell, taste. */
  | { kind: 'past_best_before'; daysOver: number }
  /** Use-by date passed: do not eat (food safety). */
  | { kind: 'past_use_by'; daysOver: number };

export function expiryStatus(
  expiresOn: LocalDate,
  today: LocalDate,
  dateKind: DateKind,
  soonThresholdDays = SOON_THRESHOLD_DAYS,
): ExpiryStatus {
  const daysLeft = daysBetween(today, expiresOn);
  if (daysLeft > soonThresholdDays) {
    return { kind: 'fresh', daysLeft };
  }
  if (daysLeft > 0) {
    return { kind: 'soon', daysLeft };
  }
  if (daysLeft === 0) {
    return { kind: 'today' };
  }
  return dateKind === 'use_by'
    ? { kind: 'past_use_by', daysOver: -daysLeft }
    : { kind: 'past_best_before', daysOver: -daysLeft };
}

/** Expiry estimate from the category's typical shelf life; null if the location is unsuitable. */
export function estimateExpiry(
  category: Category,
  location: StorageLocation,
  purchasedOn: LocalDate,
): LocalDate | null {
  const days = category.shelfLifeDays[location];
  return days === null ? null : addDays(purchasedOn, days);
}

export interface MoveResult {
  expiresOn: LocalDate;
  /** Set when the item goes into the freezer, cleared otherwise. */
  frozenOn?: LocalDate;
}

/**
 * New (estimated) expiry when an item changes location (US-14). Returns null if the category
 * cannot be stored at the target location.
 *
 * - into the freezer: today + freezer shelf life
 * - out of the freezer (thawing): today + 1 day for use-by food, else at most 2 days
 * - between fridge and pantry: keep the date, but never later than today + target shelf life
 */
export function expiryAfterMove(params: {
  category: Category;
  from: StorageLocation;
  to: StorageLocation;
  today: LocalDate;
  currentExpiresOn: LocalDate;
}): MoveResult | null {
  const { category, from, to, today, currentExpiresOn } = params;
  const targetDays = category.shelfLifeDays[to];
  if (targetDays === null) {
    return null;
  }
  if (from === to) {
    return { expiresOn: currentExpiresOn };
  }
  if (to === 'freezer') {
    return { expiresOn: addDays(today, targetDays), frozenOn: today };
  }
  if (from === 'freezer') {
    const thawedDays =
      category.dateKind === 'use_by' ? THAWED_USE_BY_DAYS : Math.min(targetDays, THAWED_MAX_DAYS);
    return { expiresOn: addDays(today, thawedDays) };
  }
  return { expiresOn: minLocalDate(currentExpiresOn, addDays(today, targetDays)) };
}
