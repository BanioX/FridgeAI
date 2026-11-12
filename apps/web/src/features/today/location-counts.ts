import type { InventoryItemView, StorageLocation } from '@fridgeai/core';
import { locationOrder } from '../inventory/item-meta';

export interface LocationCount {
  location: StorageLocation;
  /** Articles (rows) lying there now. */
  items: number;
  /** Of those, what «Heute retten» lists: due today, soon, or past its date. */
  urgent: number;
}

/**
 * The four tiles on «Start» (Alban, 12.11.2026): how many articles lie in each storage location
 * and how many of them need attention. Kühlschrank first, then Tiefkühler, Vorrat, Notvorrat.
 */
export function locationCounts(
  items: readonly Pick<InventoryItemView, 'location'>[],
  urgent: readonly Pick<InventoryItemView, 'location'>[],
): LocationCount[] {
  return locationOrder.map((location) => ({
    location,
    items: items.filter((item) => item.location === location).length,
    urgent: urgent.filter((item) => item.location === location).length,
  }));
}
