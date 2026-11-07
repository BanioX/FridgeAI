import { expiryStatus, soonThresholdFor, type InventoryItemView } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { expiryBadge } from '../../ui/expiry-badge';
import { InventoryItemRow } from './InventoryItemRow';
import { otherPacks } from './other-packs';

const t = messages.itemDetail;

/**
 * «Weitere Packungen» on the item page: the other packs of the same product with their dates,
 * e.g. two yoghurts bought a week apart. If another one expires first, it says so.
 */
export function OtherPacks({ item }: { item: InventoryItemView }) {
  const { householdId, inventory, today } = useAppData();
  const packs =
    useLiveQuery(
      async () => otherPacks((await inventory['inventory.list']({ householdId })).items, item),
      [householdId, item.id, item.productId, item.expiresOn],
    ) ?? [];
  const [first] = packs;
  if (first === undefined) {
    return null;
  }
  return (
    <section aria-labelledby="other-packs-title" className="space-y-3">
      <div>
        <h2 id="other-packs-title" className="font-display text-xl font-semibold">
          {t.otherPacks}
        </h2>
        {first.expiresOn < item.expiresOn ? (
          <p className="text-ink-muted">{t.otherPacksEarlier}</p>
        ) : null}
      </div>
      <GroupedList>
        {packs.map((pack) => (
          <GroupedListItem key={pack.id}>
            <Link to={`/inventory/${pack.id}`} className={GROUPED_ROW_LINK}>
              <InventoryItemRow
                chevron
                item={pack}
                status={expiryBadge(
                  expiryStatus(
                    pack.expiresOn,
                    today,
                    pack.expiryKind,
                    soonThresholdFor(pack.location),
                  ),
                  pack.expiresOn,
                  today,
                  pack.location,
                )}
              />
            </Link>
          </GroupedListItem>
        ))}
      </GroupedList>
    </section>
  );
}
