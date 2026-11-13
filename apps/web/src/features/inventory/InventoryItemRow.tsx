import { itemBadges, type InventoryItemView } from '@fridgeai/core';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { ItemBadges } from '../../ui/ItemBadges';
import { ItemRow } from '../../ui/ItemRow';
import { OwnerMark } from '../people/OwnerMark';
import type { Tone } from '../../ui/tones';
import { itemMeta } from './item-meta';
import { useProductImage } from './use-product-image';

/** An item in a list (Start, Vorrat): with its pack picture when the device has one. */
export function InventoryItemRow({
  item,
  status,
  chevron = false,
  sliced = false,
  attention = false,
}: {
  item: InventoryItemView;
  status: { tone: Tone; label: string };
  chevron?: boolean;
  sliced?: boolean;
  /** «Im Blick» (ADR-0073): show the quiet (i) after the name. */
  attention?: boolean;
}) {
  const image = useProductImage(item.gtin);
  const { today } = useAppData();
  const badges = itemBadges(item, today);
  return (
    <ItemRow
      categoryId={item.categoryId}
      image={image}
      name={item.name}
      meta={itemMeta(item)}
      status={status}
      badges={badges.length === 0 ? undefined : <ItemBadges badges={badges} max={2} />}
      owner={item.owner === 'shared' ? undefined : <OwnerMark ownerId={item.owner} />}
      attention={attention ? messages.attention.marker : undefined}
      chevron={chevron}
      sliced={sliced}
      shop={
        item.retailer === undefined
          ? undefined
          : {
              retailer: item.retailer,
              label: messages.itemDetail.boughtAt(messages.receiptUpload.retailers[item.retailer]),
            }
      }
    />
  );
}
