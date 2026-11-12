import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, MapPin } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { locationStyle } from '../../ui/LocationTile';
import { formatQuantity } from '../../ui/quantity-text';
import { putAwaySections } from './put-away';

const t = messages.inventory.putAway;

/**
 * «Einräumen» after a receipt: where each new article goes, per location and spot, so everything
 * lands in its place. Each row opens the item, where a spot can be set.
 */
export function PutAwayPage() {
  const { householdId, inventory } = useAppData();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ids = params.getAll('item');

  const items = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items,
    [householdId],
  );
  const sections = items === undefined ? undefined : putAwaySections(items, ids);
  const empty = sections?.length === 0;

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
                <h3 className="flex items-center gap-1.5 px-1 text-sm font-semibold text-ink-muted">
                  <MapPin size={16} aria-hidden="true" />
                  {group.spot?.name ?? t.noSpot}
                </h3>
                <GroupedList>
                  {group.items.map((item) => (
                    <GroupedListItem key={item.id} inset="text">
                      <Link to={`/inventory/${item.id}`} className={GROUPED_ROW_LINK}>
                        <span className="flex min-h-12 items-center gap-3 py-2 pr-3 pl-4">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{item.name}</span>
                            <span className="block text-sm text-ink-muted">
                              {formatQuantity(item.quantity, item.unit)}
                            </span>
                          </span>
                          <ChevronRight
                            size={18}
                            aria-hidden="true"
                            className="shrink-0 text-ink-muted"
                          />
                        </span>
                      </Link>
                    </GroupedListItem>
                  ))}
                </GroupedList>
              </div>
            ))}
          </section>
        );
      })}

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
