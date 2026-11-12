import type { InventoryItemView, LocalDate, Owner } from '@fridgeai/core';

/** What the sheet changes on every chosen item; a missing field stays as it is. */
export interface BulkChanges {
  expiresOn?: LocalDate;
  owner?: Owner;
  /** Mark as opened (`inventory.open`); items that are already open are skipped. */
  open?: boolean;
}

/** Items still closed: only these get `inventory.open` (it would shorten the date a second time). */
export function stillClosed(items: readonly InventoryItemView[]): InventoryItemView[] {
  return items.filter((item) => item.openedOn === undefined);
}

/** The status line after a bulk edit: what changed, and what did not work. */
export function bulkText(
  changed: readonly string[],
  failed: readonly string[],
  nothingToOpen: boolean,
  text: {
    changedOne: (name: string) => string;
    changedMany: (n: number) => string;
    allOpened: string;
    failedSome: (names: readonly string[]) => string;
  },
): string {
  const [only] = changed;
  const done =
    changed.length === 0
      ? nothingToOpen && failed.length === 0
        ? text.allOpened
        : ''
      : changed.length === 1 && only !== undefined
        ? text.changedOne(only)
        : text.changedMany(changed.length);
  const bad = failed.length === 0 ? '' : text.failedSome(failed);
  return [done, bad].filter((part) => part !== '').join(' ');
}
