import { STORAGE_LOCATIONS } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { OwnerMark } from '../people/OwnerMark';
import { useMembers } from '../people/use-members';
import { searchStock } from './spots-search';
import { SpotThumb } from './SpotThumb';
import { useSpots } from './use-spots';

const t = messages.spots;

/**
 * «Wo ist was?» under «Mehr» (ADR-0056): search the stock by name and see where it lies, below the
 * storage spots by location. The search lives in the address (`?q=zucker`), so a shortcut on the
 * phone can open «Wo ist der Zucker?» directly; typing replaces the entry, the back button is not
 * flooded.
 */
export function SpotsPage() {
  const { householdId, inventory } = useAppData();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const spots = useSpots();
  const items = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items,
    [householdId],
  );
  const spotPhoto = new Map((spots ?? []).map((spot) => [spot.id, spot.photo]));
  const members = useMembers();
  const found = searchStock(items ?? [], spots ?? [], members ?? [], query);
  const hitCount = found.spots.length + found.items.length;

  const change = (value: string) => {
    setParams(value === '' ? {} : { q: value }, { replace: true });
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <BackLink to="/more" label={t.backToMore} />
        <h1 className="large-title">{messages.pages.spots}</h1>
      </div>
      <p className="text-ink-muted">{t.intro}</p>

      <div className="space-y-1.5">
        <label htmlFor="spot-search" className="block text-sm font-semibold">
          {t.searchLabel}
        </label>
        <div className="relative">
          <Search
            size={20}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted"
          />
          <input
            id="spot-search"
            type="search"
            value={query}
            onChange={(event) => {
              change(event.target.value);
            }}
            placeholder={t.searchPlaceholder}
            autoComplete="off"
            enterKeyHint="search"
            className="min-h-12 w-full rounded-xl border border-line bg-surface pr-4 pl-11 text-lg outline-none focus:border-basil-600"
          />
        </div>
      </div>

      {query.trim() === '' ? null : (
        <section aria-labelledby="spot-hits" className="space-y-2">
          <h2 id="spot-hits" className="sr-only">
            {t.searchResults(hitCount)}
          </h2>
          {hitCount === 0 ? (
            <p className="text-ink-muted">{t.searchNone(query.trim())}</p>
          ) : (
            <GroupedList>
              {found.spots.map((spot) => (
                <GroupedListItem key={spot.id}>
                  <Link
                    to={`/more/spots/${spot.id}`}
                    className={`${GROUPED_ROW_LINK} flex min-h-15 items-center gap-3 py-2.5 pr-3 pl-4`}
                  >
                    <SpotThumb photo={spot.photo} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{spot.name}</span>
                      <span className="block text-sm text-ink-muted">
                        {messages.locations[spot.location]} · {t.count(spot.itemCount)}
                      </span>
                    </span>
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-ink-muted/60"
                    />
                  </Link>
                </GroupedListItem>
              ))}
              {found.items.map((item) => (
                <GroupedListItem key={item.id}>
                  <Link
                    to={`/inventory/${item.id}`}
                    className={`${GROUPED_ROW_LINK} flex min-h-15 items-center gap-3 py-2.5 pr-3 pl-4`}
                  >
                    {item.spot === null ? (
                      <span
                        aria-hidden="true"
                        className="grid size-10 shrink-0 place-items-center text-2xl leading-none"
                      >
                        {item.emoji}
                      </span>
                    ) : (
                      <SpotThumb photo={spotPhoto.get(item.spot.id)} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{item.name}</span>
                      <span className="block truncate text-sm text-ink-muted">
                        {messages.locations[item.location]} ·{' '}
                        {item.spot === null ? t.noSpotYet : item.spot.name}
                      </span>
                    </span>
                    {item.owner === 'shared' ? null : <OwnerMark ownerId={item.owner} />}
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-ink-muted/60"
                    />
                  </Link>
                </GroupedListItem>
              ))}
            </GroupedList>
          )}
        </section>
      )}

      {spots === undefined ? null : spots.length === 0 ? (
        <p className="rounded-2xl bg-basil-50 p-5 text-basil-900">{t.empty}</p>
      ) : (
        STORAGE_LOCATIONS.map((location) => {
          const here = spots.filter((spot) => spot.location === location);
          if (here.length === 0) {
            return null;
          }
          const headingId = `spots-${location}`;
          return (
            <section key={location} aria-labelledby={headingId} className="space-y-2">
              <h2 id={headingId} className="font-display text-xl font-semibold">
                {messages.locations[location]}
              </h2>
              <GroupedList>
                {here.map((spot) => (
                  <GroupedListItem key={spot.id}>
                    <Link
                      to={`/more/spots/${spot.id}`}
                      className={`${GROUPED_ROW_LINK} flex min-h-15 items-center gap-3 py-2.5 pr-3 pl-4`}
                    >
                      <SpotThumb photo={spot.photo} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{spot.name}</span>
                        <span className="block text-sm text-ink-muted">
                          {t.count(spot.itemCount)}
                        </span>
                      </span>
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="shrink-0 text-ink-muted/60"
                      />
                    </Link>
                  </GroupedListItem>
                ))}
              </GroupedList>
            </section>
          );
        })
      )}
    </div>
  );
}
