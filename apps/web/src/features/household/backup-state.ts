import { daysBetween, localDate, toLocalDate, type LocalDate } from '@fridgeai/core';

/**
 * Visible backups: Rettich keeps everything on this device (local-first), so a lost or reset phone
 * loses it all. Other apps are reviewed badly for lost data; Rettich says plainly when the last
 * export was and reminds calmly once a month (docs/ideen/mitbewerber-apps.md).
 */

/** A month without an export is long enough to remind, short enough to lose little. */
export const BACKUP_EVERY_DAYS = 30;
/** Below this, a reminder would nag more than it protects. */
export const BACKUP_MIN_ITEMS = 10;
/** The first reminder waits until Rettich has been used for two weeks. */
export const BACKUP_FIRST_AFTER_DAYS = 14;

/**
 * Due when there is enough to lose and either no export for a month, or none at all although the
 * oldest article was added two weeks ago.
 */
export function backupDue(
  last: LocalDate | null,
  today: LocalDate,
  itemCount: number,
  oldestAddedOn: LocalDate | null,
): boolean {
  if (itemCount < BACKUP_MIN_ITEMS) {
    return false;
  }
  if (last !== null) {
    return daysBetween(last, today) >= BACKUP_EVERY_DAYS;
  }
  return oldestAddedOn !== null && daysBetween(oldestAddedOn, today) >= BACKUP_FIRST_AFTER_DAYS;
}

const KEY = 'fridgeai:last-backup';

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function localStore(): (Store & Pick<Storage, 'removeItem'>) | undefined {
  try {
    return window.localStorage;
  } catch {
    // Blocked storage (private mode): no date to show, the reminder decides without it.
    return undefined;
  }
}

/** The day of the last export on this device, if any. */
export function readLastBackup(store: Store | undefined = localStore()): LocalDate | null {
  try {
    const value = store?.getItem(KEY) ?? null;
    return value === null ? null : localDate(value);
  } catch {
    return null;
  }
}

export function writeLastBackup(today: LocalDate, store: Store | undefined = localStore()): void {
  try {
    store?.setItem(KEY, today);
  } catch {
    // Not worth bothering the person: the reminder just shows up again.
  }
}

/** A full delete leaves nothing to restore from this device's last export: forget the date. */
export function clearLastBackup(
  store: Pick<Storage, 'removeItem'> | undefined = localStore(),
): void {
  try {
    store?.removeItem(KEY);
  } catch {
    // Blocked storage: nothing was written, nothing to clear.
  }
}

/**
 * After an import the data is exactly as saved in the file, so the file's own export time is the
 * date of the backup it restores (Swiss day); without a usable time it counts as today.
 */
export function backupDayOfImport(exportedAt: string | undefined, today: LocalDate): LocalDate {
  try {
    return exportedAt === undefined ? today : toLocalDate(exportedAt);
  } catch {
    return today;
  }
}
