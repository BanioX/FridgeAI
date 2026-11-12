import type { InventoryItemView, StorageLocation } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';
import { formatQuantity } from '../../ui/quantity-text';

export const locationOrder: readonly StorageLocation[] = ['fridge', 'freezer', 'pantry', 'reserve'];

/**
 * «500 g · Kühlschrank», «0.5 Stk. · Kühlschrank», «1 kg · Vorrat». With a spot (ADR-0056) its
 * name takes the place of the location word: «1 Stk. · Oberer Schrank links».
 */
export function itemMeta(item: InventoryItemView, withSpot = true): string {
  const place = (withSpot ? item.spot?.name : undefined) ?? messages.locations[item.location];
  return `${formatQuantity(item.quantity, item.unit)} · ${place}`;
}
