import type { InventoryItemView } from '@fridgeai/core';

/** The other packs of the same product at home, the one that expires first on top. */
export function otherPacks(
  items: readonly InventoryItemView[],
  item: InventoryItemView,
): InventoryItemView[] {
  return items
    .filter((other) => other.productId === item.productId && other.id !== item.id)
    .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn) || a.id.localeCompare(b.id));
}
