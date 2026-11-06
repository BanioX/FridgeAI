import type { InventoryItemView, StorageLocation } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';

export const locationOrder: readonly StorageLocation[] = ['fridge', 'freezer', 'pantry', 'reserve'];

/** «500 g · Kühlschrank» */
export function itemMeta(item: InventoryItemView): string {
  return `${String(item.quantity)} ${messages.units[item.unit]} · ${messages.locations[item.location]}`;
}
