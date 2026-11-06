import type { InventoryItemView, StorageLocation } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';
import { formatQuantity } from './portion-labels';

export const locationOrder: readonly StorageLocation[] = ['fridge', 'freezer', 'pantry', 'reserve'];

/** «500 g · Kühlschrank», «0.5 Stk. · Kühlschrank», «1 kg · Vorrat» */
export function itemMeta(item: InventoryItemView): string {
  return `${formatQuantity(item.quantity, item.unit)} · ${messages.locations[item.location]}`;
}
