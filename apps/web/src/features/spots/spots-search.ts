import type { InventoryItemView } from '@fridgeai/core';

/** Lower case without accents, so «zucker», «Zucker» and «Crème» find each other. */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/**
 * «Wo ist der Zucker?»: the stock whose name contains the query, in every location. An empty
 * query finds nothing (the page then shows the spots only).
 */
export function findInStock(
  items: readonly InventoryItemView[],
  query: string,
): InventoryItemView[] {
  const needle = fold(query);
  if (needle === '') {
    return [];
  }
  return items.filter((item) => fold(item.name).includes(needle));
}
