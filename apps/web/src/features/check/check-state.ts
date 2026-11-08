import {
  daysBetween,
  localDate,
  needsWatching,
  type InventoryItemView,
  type LocalDate,
} from '@fridgeai/core';

/** The four answers of the fridge check (UC-04, ADR-0022). */
export type CheckAnswer = 'still' | 'half' | 'eaten' | 'wasted';

/** Once a week is enough to keep the fridge current without nagging. */
export const CHECK_EVERY_DAYS = 7;

/**
 * Fridge items in the order the check asks for them: soonest date first, then by name. Robust
 * food with a far date (drinks, an unopened sauce) is left out (ADR-0038).
 */
export function checkQueue(
  items: readonly InventoryItemView[],
  today: LocalDate,
): InventoryItemView[] {
  return items
    .filter((item) => item.location === 'fridge' && needsWatching(item, today))
    .sort(
      (a, b) => a.expiresOn.localeCompare(b.expiresOn) || a.name.localeCompare(b.name, 'de-CH'),
    );
}

/** Due when there was never a check on this device or the last one is a week old. */
export function checkDue(last: LocalDate | null, today: LocalDate): boolean {
  return last === null || daysBetween(last, today) >= CHECK_EVERY_DAYS;
}

export function tally(answers: readonly CheckAnswer[]): Record<CheckAnswer, number> {
  const counts: Record<CheckAnswer, number> = { still: 0, half: 0, eaten: 0, wasted: 0 };
  for (const answer of answers) {
    counts[answer] += 1;
  }
  return counts;
}

const KEY = 'fridgeai:last-fridge-check';

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function localStore(): Store | undefined {
  try {
    return window.localStorage;
  } catch {
    // Blocked storage (private mode): the check is then simply always offered.
    return undefined;
  }
}

/** The day of the last finished check on this device, if any. */
export function readLastCheck(store = localStore()): LocalDate | null {
  try {
    const value = store?.getItem(KEY) ?? null;
    return value === null ? null : localDate(value);
  } catch {
    return null;
  }
}

export function writeLastCheck(today: LocalDate, store = localStore()): void {
  try {
    store?.setItem(KEY, today);
  } catch {
    // Not worth bothering the person: the card just shows up again.
  }
}
