import type { InventoryItemView, LocalDate, Owner, StorageLocation } from '@fridgeai/core';

/** What the sheet changes on every chosen item; a missing field stays as it is. */
export interface BulkChanges {
  expiresOn?: LocalDate;
  owner?: Owner;
  /** The place (ADR-0056): a spot id, or `null` for «Kein fester Platz». Missing: stays as it is. */
  spot?: string | null;
  /** Mark as opened (`inventory.open`); items that are already open are skipped. */
  open?: boolean;
}

/** Items still closed: only these get `inventory.open` (it would shorten the date a second time). */
export function stillClosed(items: readonly InventoryItemView[]): InventoryItemView[] {
  return items.filter((item) => item.openedOn === undefined);
}

/** The storage location all items share, or `null` when they lie in several (or there are none). */
export function sharedLocation(items: readonly InventoryItemView[]): StorageLocation | null {
  const [first] = items;
  if (first === undefined) {
    return null;
  }
  return items.every((item) => item.location === first.location) ? first.location : null;
}

/**
 * Sets the spot once per distinct product (the spot belongs to the product, so several packs of
 * it need one call). Every item of a product counts as changed or failed with its product.
 */
export async function applySpot(
  items: readonly InventoryItemView[],
  setSpot: (productId: string) => Promise<unknown>,
): Promise<{ changed: InventoryItemView[]; failed: InventoryItemView[] }> {
  const byProduct = new Map<string, InventoryItemView[]>();
  for (const item of items) {
    byProduct.set(item.productId, [...(byProduct.get(item.productId) ?? []), item]);
  }
  const changed: InventoryItemView[] = [];
  const failed: InventoryItemView[] = [];
  for (const [productId, own] of byProduct) {
    try {
      await setSpot(productId);
      changed.push(...own);
    } catch {
      failed.push(...own);
    }
  }
  return { changed, failed };
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
