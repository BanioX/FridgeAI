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

export interface StockSearch<S extends { id: string; name: string }> {
  /** Spots whose name matches; the stock lying there is among `items`. */
  spots: S[];
  /** Items by name, by the spot they lie in, or by the person they belong to (no repeats). */
  items: InventoryItemView[];
}

/**
 * «Wo ist was?» beyond the item name: a query that matches a spot name also finds that spot and
 * everything lying there; a query that matches a person's name or initials finds what belongs to
 * them, but only with two or more people (alone, «Gehört» does not exist, ADR-0058).
 */
export function searchStock<S extends { id: string; name: string }>(
  items: readonly InventoryItemView[],
  spots: readonly S[],
  members: readonly { id: string; displayName: string; initials: string }[],
  query: string,
): StockSearch<S> {
  const needle = fold(query);
  if (needle === '') {
    return { spots: [], items: [] };
  }
  const spotHits = spots.filter((spot) => fold(spot.name).includes(needle));
  const spotIds = new Set(spotHits.map((spot) => spot.id));
  const ownerIds = new Set<string>(
    members.length < 2
      ? []
      : members
          .filter(
            (member) =>
              fold(member.displayName).includes(needle) || fold(member.initials).includes(needle),
          )
          .map((member) => member.id),
  );
  return {
    spots: spotHits,
    items: items.filter(
      (item) =>
        fold(item.name).includes(needle) ||
        (item.spot !== null && spotIds.has(item.spot.id)) ||
        ownerIds.has(item.owner),
    ),
  };
}
