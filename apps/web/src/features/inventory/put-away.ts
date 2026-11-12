import type { Id, InventoryItemView, StorageLocation } from '@fridgeai/core';
import { locationOrder } from './item-meta';

/** The articles of one spot of a location; `spot` is null for those without a fixed place. */
export interface PutAwayGroup {
  spot: { id: Id; name: string } | null;
  items: InventoryItemView[];
}

export interface PutAwaySection {
  location: StorageLocation;
  groups: PutAwayGroup[];
}

/**
 * «Einräumen»: the listed items (those that still exist) per location in the usual order, inside it
 * per spot by name and the ones without a spot last. Empty locations are left out.
 */
export function putAwaySections(
  items: readonly InventoryItemView[],
  ids: readonly string[],
): PutAwaySection[] {
  const wanted = new Set(ids);
  const picked = items.filter((item) => wanted.has(item.id));
  return locationOrder.flatMap((location) => {
    const here = picked.filter((item) => item.location === location);
    if (here.length === 0) {
      return [];
    }
    const spots = new Map<Id, PutAwayGroup>();
    const loose: InventoryItemView[] = [];
    for (const item of here) {
      if (item.spot === null) {
        loose.push(item);
        continue;
      }
      const group = spots.get(item.spot.id) ?? {
        spot: { id: item.spot.id, name: item.spot.name },
        items: [],
      };
      group.items.push(item);
      spots.set(item.spot.id, group);
    }
    const groups = [...spots.values()].sort((a, b) =>
      (a.spot?.name ?? '').localeCompare(b.spot?.name ?? '', 'de-CH'),
    );
    if (loose.length > 0) {
      groups.push({ spot: null, items: loose });
    }
    return [{ location, groups }];
  });
}
