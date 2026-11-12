import type { InventoryItemView } from '@fridgeai/core';

/**
 * Shelf by shelf (O9): the check's queue grouped by spot. Spots named like a fridge shelf come
 * first, in the fridge's order (`shelfNames`, top of the list first), other spots follow by name,
 * items without a spot come last. Within a spot the queue's order stays (the sort is stable).
 */
export function groupBySpot(
  queue: readonly InventoryItemView[],
  shelfNames: readonly string[],
): InventoryItemView[] {
  const shelves = shelfNames.map((name) => name.trim().toLowerCase());
  const rank = (item: InventoryItemView): number => {
    if (item.spot === null) {
      return shelves.length + 1;
    }
    const index = shelves.indexOf(item.spot.name.trim().toLowerCase());
    return index === -1 ? shelves.length : index;
  };
  return [...queue].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0 || a.spot === null || b.spot === null) {
      return byRank;
    }
    // Same rank, so either the same shelf or two other spots: by name, then id, to keep groups whole.
    return a.spot.name.localeCompare(b.spot.name, 'de-CH') || a.spot.id.localeCompare(b.spot.id);
  });
}

/**
 * The cue above a card: undefined while the spot is the same as on the card before (or when
 * nobody in this check has a spot), `null` for «Ohne festen Platz», else the spot.
 */
export function spotCue(
  queue: readonly InventoryItemView[],
  index: number,
): InventoryItemView['spot'] | undefined {
  const current = queue[index];
  if (current === undefined || queue.every((item) => item.spot === null)) {
    return undefined;
  }
  const before = index === 0 ? undefined : queue[index - 1];
  if (before !== undefined && before.spot?.id === current.spot?.id) {
    return undefined;
  }
  return current.spot;
}
