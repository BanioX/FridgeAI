import { shelfLifeAt, type Category } from './catalog/category';
import { addDays, addMonths, addYears, daysBetween, minLocalDate } from './dates';
import type { DateKind, LocalDate, StorageLocation } from './model/primitives';

/** Items expiring within this many days count as «läuft bald ab». */
export const SOON_THRESHOLD_DAYS = 3;

/** The Notvorrat needs months of notice: eat the oldest stock and replace it («rollierend»). */
export const RESERVE_SOON_THRESHOLD_DAYS = 90;

export function soonThresholdFor(location: StorageLocation): number {
  return location === 'reserve' ? RESERVE_SOON_THRESHOLD_DAYS : SOON_THRESHOLD_DAYS;
}

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
  const days = shelfLifeAt(category, location);
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
  const targetDays = shelfLifeAt(category, to);
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

export type PresetUnit = 'day' | 'week' | 'month' | 'year';

export interface ExpiryPreset {
  unit: PresetUnit;
  amount: number;
  date: LocalDate;
}

type Horizon = readonly (readonly [PresetUnit, number])[];

const SHORT: Horizon = [
  ['day', 1],
  ['day', 2],
  ['day', 3],
  ['week', 1],
  ['week', 2],
];
const MEDIUM: Horizon = [
  ['week', 1],
  ['month', 1],
  ['month', 3],
  ['month', 6],
  ['year', 1],
];
const LONG: Horizon = [
  ['month', 6],
  ['year', 1],
  ['year', 2],
  ['year', 3],
  ['year', 5],
];
const RESERVE: Horizon = [
  ['year', 1],
  ['year', 5],
  ['year', 10],
  ['year', 25],
  ['year', 50],
];

/**
 * One-tap date choices for the expiry field, matched to the time horizon of the item: days for the
 * fridge, months for the freezer, years for the pantry and decades for the Notvorrat.
 */
export function expiryPresets(
  location: StorageLocation,
  today: LocalDate,
  typicalShelfLifeDays: number | null = null,
): ExpiryPreset[] {
  let horizon: Horizon;
  if (location === 'reserve') {
    horizon = RESERVE;
  } else if (location === 'freezer') {
    horizon = MEDIUM;
  } else if (typicalShelfLifeDays !== null && typicalShelfLifeDays > 365) {
    horizon = LONG;
  } else if (typicalShelfLifeDays !== null && typicalShelfLifeDays > 21) {
    horizon = MEDIUM;
  } else {
    horizon = SHORT;
  }
  return horizon.map(([unit, amount]) => {
    let date: LocalDate;
    switch (unit) {
      case 'day':
        date = addDays(today, amount);
        break;
      case 'week':
        date = addDays(today, amount * 7);
        break;
      case 'month':
        date = addMonths(today, amount);
        break;
      case 'year':
        date = addYears(today, amount);
        break;
    }
    return { unit, amount, date };
  });
}

/**
 * Opening a pack (ADR-0011): from today, «after opening within N days» applies. The effective date
 * is the earlier of the current date and today + N. N comes from the label (item) or the category;
 * without either, opening changes nothing. The previous date is kept to allow undo.
 */
export function expiryAfterOpening(params: {
  expiresOn: LocalDate;
  today: LocalDate;
  itemAfterOpeningDays?: number;
  categoryAfterOpeningDays?: number;
}): { expiresOn: LocalDate; shortened: boolean } {
  const days = params.itemAfterOpeningDays ?? params.categoryAfterOpeningDays;
  if (days === undefined) {
    return { expiresOn: params.expiresOn, shortened: false };
  }
  const afterOpening = addDays(params.today, days);
  return afterOpening < params.expiresOn
    ? { expiresOn: afterOpening, shortened: true }
    : { expiresOn: params.expiresOn, shortened: false };
}
