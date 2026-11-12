import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, MapPin } from 'lucide-react';
import { formatSwissDate, type ExpiryFromText, type InventoryItemView } from '@fridgeai/core';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { locationStyle } from '../../ui/LocationTile';
import { formatQuantity } from '../../ui/quantity-text';
import { DatePhotoButton } from './DatePhotoButton';
import { putAwaySections } from './put-away';

const t = messages.inventory.putAway;

/**
 * «Einräumen» after a receipt: where each new article goes, per location and spot, so everything
 * lands in its place. Each row opens the item, where a spot can be set.
 */
export function PutAwayPage() {
  const { householdId, ids: idSource, inventory, today } = useAppData();
  // The date of these was read from the pack just now; their camera stays for a second try.
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());
  const [status, setStatus] = useState('');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ids = params.getAll('item');

  const items = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items,
    [householdId],
  );
  const sections = items === undefined ? undefined : putAwaySections(items, ids);
  const empty = sections?.length === 0;

  async function saveDate(item: InventoryItemView, found: ExpiryFromText) {
    try {
      await inventory['inventory.updateItem']({
        commandId: idSource.next(),
        householdId,
        itemId: item.id,
        expiresOn: found.date,
        expirySource: 'label_ocr',
        ...(found.kind === undefined ? {} : { expiryKind: found.kind }),
      });
      setReadIds((before) => new Set(before).add(item.id));
      setStatus(t.dateSaved(item.name, formatSwissDate(found.date)));
    } catch {
      setStatus(messages.editItem.failed);
    }
  }

  useEffect(() => {
    // Nothing left to put away (deleted, closed, or a bare link): back to the stock.
    if (empty) {
      void navigate('/inventory', { replace: true });
    }
  }, [empty, navigate]);

  if (sections === undefined || sections.length === 0) {
    return <p className="sr-only">{messages.loading}</p>;
  }
  const count = sections.reduce(
    (sum, section) => sum + section.groups.reduce((inner, group) => inner + group.items.length, 0),
    0,
  );
  const first = sections[0]?.location ?? 'fridge';

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="large-title">{t.title}</h1>
        <p className="text-ink-muted">{t.subline(count)}</p>
      </div>

      {sections.map(({ location, groups }) => {
        const { icon: Icon, classes } = locationStyle[location];
        // Without any saved spot here, a lone «Ohne festen Platz» heading would only be noise.
        const showSpots = groups.some((group) => group.spot !== null);
        return (
          <section key={location} aria-labelledby={`put-away-${location}`} className="space-y-3">
            <h2 id={`put-away-${location}`} className="flex items-center gap-2 text-lg font-bold">
              <span
                className={`flex size-8 items-center justify-center rounded-lg ${classes}`}
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>
              {messages.locations[location]}
            </h2>
            {groups.map((group) => (
              <div key={group.spot?.id ?? 'loose'} className="space-y-1">
                {showSpots ? (
                  <h3 className="flex items-center gap-1.5 px-1 text-sm font-semibold text-ink-muted">
                    <MapPin size={16} aria-hidden="true" />
                    {group.spot?.name ?? t.noSpot}
                  </h3>
                ) : null}
                <GroupedList>
                  {group.items.map((item) => (
                    <GroupedListItem key={item.id} inset="text">
                      <div className="flex items-center pr-2">
                        <Link
                          to={`/inventory/${item.id}`}
                          className={`${GROUPED_ROW_LINK} min-w-0 flex-1`}
                        >
                          <span className="flex min-h-12 items-center gap-3 py-2 pr-1 pl-4">
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">{item.name}</span>
                              <span className="block text-sm text-ink-muted">
                                {formatQuantity(item.quantity, item.unit)}
                              </span>
                              <span className="block text-sm text-ink-muted">
                                {t.expires(
                                  formatSwissDate(item.expiresOn),
                                  item.expirySource === 'category_estimate',
                                )}
                              </span>
                            </span>
                            <ChevronRight
                              size={18}
                              aria-hidden="true"
                              className="shrink-0 text-ink-muted"
                            />
                          </span>
                        </Link>
                        {item.expirySource === 'category_estimate' || readIds.has(item.id) ? (
                          <DatePhotoButton
                            itemName={item.name}
                            today={today}
                            onRead={(found) => {
                              void saveDate(item, found);
                            }}
                            onStatus={setStatus}
                          />
                        ) : null}
                      </div>
                    </GroupedListItem>
                  ))}
                </GroupedList>
              </div>
            ))}
          </section>
        );
      })}

      <p role="status" className="text-sm font-semibold text-basil-800 empty:hidden">
        {status}
      </p>

      <Button
        fullWidth
        onClick={() => {
          void navigate(`/inventory?location=${first}`);
        }}
      >
        {t.done}
      </Button>
    </div>
  );
}
