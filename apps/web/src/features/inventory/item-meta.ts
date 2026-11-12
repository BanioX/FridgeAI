import { packContent, type InventoryItemView, type StorageLocation } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';
import { formatPieces, formatQuantity } from '../../ui/quantity-text';

export const locationOrder: readonly StorageLocation[] = ['fridge', 'freezer', 'pantry', 'reserve'];

/**
 * «500 g · Kühlschrank», «0.5 Stk. · Kühlschrank». With a spot (ADR-0056) its name takes the
 * place of the location word: «1 Stk. · Oberer Schrank links». Packs read short in a row of the
 * list, «2 × 10 Stk.», and in full on the item page, «2 Packungen à 10 Stk.».
 */
export function itemMeta(item: InventoryItemView, withSpot = true, packs: PackWords = 'short') {
  const place = (withSpot ? item.spot?.name : undefined) ?? messages.locations[item.location];
  return `${quantityText(item, packs)} · ${place}`;
}

type PackWords = 'short' | 'full';

/**
 * The amount, in packs where the item knows its pack (ADR-0066): «1 Packung à 10 Stk.» or
 * «1 × 10 Stk.», «7 von 10 Stk.» for an opened pack, «1 Packung à 10 + 7 Stk.» or
 * «1 × 10 + 7 Stk.» for both.
 */
export function quantityText(item: InventoryItemView, packs: PackWords = 'full'): string {
  const content = item.unit === 'pcs' ? packContent(item) : undefined;
  if (content === undefined) {
    return formatQuantity(item.quantity, item.unit);
  }
  const t = messages.packText[packs];
  const per = String(content.perPack);
  if (content.open === 0) {
    return t.whole(content.full, per);
  }
  const open = formatPieces(content.open);
  return content.full === 0 ? messages.packText.opened(open, per) : t.both(content.full, per, open);
}
