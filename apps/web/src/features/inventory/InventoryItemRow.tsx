import type { InventoryItemView } from '@fridgeai/core';
import { ItemRow } from '../../ui/ItemRow';
import type { Tone } from '../../ui/tones';
import { itemMeta } from './item-meta';
import { useProductImage } from './use-product-image';

/** An item in a list (Start, Vorrat): with its pack picture when the device has one. */
export function InventoryItemRow({
  item,
  status,
  chevron = false,
}: {
  item: InventoryItemView;
  status: { tone: Tone; label: string };
  chevron?: boolean;
}) {
  const image = useProductImage(item.gtin);
  return (
    <ItemRow
      emoji={item.emoji ?? ''}
      image={image}
      name={item.name}
      meta={itemMeta(item)}
      status={status}
      chevron={chevron}
    />
  );
}
