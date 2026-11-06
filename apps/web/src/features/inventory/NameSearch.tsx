import type { OperationOutput } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';

type SearchResult = OperationOutput<'products.search'>;
export type FoundProduct = SearchResult['products'][number];

const t = messages.nameSearch;
/** Open Food Facts is asked once the person pauses, not on every keystroke (ADR-0025). */
const PAUSE_BEFORE_SEARCH_MS = 600;
/** After a failed search (offline, more than 10 searches a minute) the app waits before asking again. */
const WAIT_AFTER_FAILURE_MS = 30_000;
const MIN_LETTERS_ONLINE = 3;
const UNAVAILABLE: SearchResult = { products: [], openDatabase: 'unavailable' };

/** «coop g» follows «coop»: earlier hits stay visible until the new ones arrive. */
const related = (a: string, b: string) =>
  a.toLowerCase().startsWith(b.toLowerCase()) || b.toLowerCase().startsWith(a.toLowerCase());

/**
 * Product search under «Was ist es?», like Yazio (ADR-0024, ADR-0025):
 * - «Bereits verwendet»: products this household already entered, live from two letters, on the
 *   device only;
 * - «Gefundene Produkte»: Open Food Facts (Switzerland) from three letters, once typing pauses.
 */
export function NameSearch({
  query,
  onPick,
}: {
  query: string;
  onPick: (product: FoundProduct) => void;
}) {
  const { householdId, inventory } = useAppData();
  const words = query.trim().replace(/\s+/g, ' ');
  const [results, setResults] = useState<Readonly<Record<string, SearchResult>>>({});
  const [latest, setLatest] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);
  const waitUntil = useRef(0);
  const known = results[words];

  const used = useLiveQuery(
    async () =>
      words.length < 2
        ? []
        : (
            await inventory['products.search']({
              householdId,
              query: words,
              limit: 5,
              scope: 'household',
            })
          ).products,
    [householdId, words],
  );

  useEffect(() => {
    if (words.length < MIN_LETTERS_ONLINE || known !== undefined) {
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      const ask =
        Date.now() < waitUntil.current
          ? Promise.resolve(UNAVAILABLE)
          : inventory['products.search']({ householdId, query: words, limit: 10 }).catch(
              () => UNAVAILABLE,
            );
      void ask.then((result) => {
        if (result.openDatabase === 'unavailable') {
          waitUntil.current = Math.max(waitUntil.current, Date.now() + WAIT_AFTER_FAILURE_MS);
        }
        setResults((all) => ({ ...all, [words]: result }));
        if (current) {
          setLatest(words);
        }
      });
    }, PAUSE_BEFORE_SEARCH_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [householdId, inventory, words, known, retries]);

  if (words.length < 2) {
    return null;
  }

  const online = words.length >= MIN_LETTERS_ONLINE;
  const shown = known ?? (latest !== null && related(latest, words) ? results[latest] : undefined);
  const more = online ? (shown?.products.filter((product) => product.source === 'off') ?? []) : [];
  const ownCount = used?.length ?? 0;

  function retry() {
    waitUntil.current = 0;
    setResults((all) => Object.fromEntries(Object.entries(all).filter(([key]) => key !== words)));
    setRetries((count) => count + 1);
  }

  return (
    <div className="space-y-3 pt-1">
      {used !== undefined && used.length > 0 ? (
        <FoundSection id="used-title" title={t.used} products={used} onPick={onPick} />
      ) : null}
      {more.length > 0 ? (
        <FoundSection id="more-title" title={t.more} products={more} onPick={onPick} />
      ) : null}
      {online ? (
        <div className="flex flex-wrap items-center gap-x-3">
          <p role="status" className="text-sm text-ink-muted">
            {known === undefined
              ? t.searching
              : known.openDatabase === 'unavailable'
                ? t.unavailable
                : more.length === 0 && ownCount === 0
                  ? t.none
                  : more.length > 0
                    ? t.attribution
                    : ''}
          </p>
          {known?.openDatabase === 'unavailable' ? (
            <Button variant="ghost" className="-ml-3" onClick={retry}>
              {t.retry}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FoundSection({
  id,
  title,
  products,
  onPick,
}: {
  id: string;
  title: string;
  products: readonly FoundProduct[];
  onPick: (product: FoundProduct) => void;
}) {
  return (
    <section aria-labelledby={id} className="space-y-1.5">
      <h2 id={id} className="text-sm font-semibold text-ink-muted">
        {title}
      </h2>
      <GroupedList>
        {products.map((product) => (
          <GroupedListItem key={`${product.source}-${product.gtin ?? product.name}`} inset="text">
            <button
              type="button"
              onClick={() => {
                onPick(product);
              }}
              className="flex min-h-14 w-full items-center gap-3 py-2 pr-3 pl-4 text-left hover:bg-surface-muted active:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{product.name}</span>
                {product.brand === undefined && product.packSize === undefined ? null : (
                  <span className="block truncate text-sm text-ink-muted">
                    {[product.brand, product.packSize].filter(Boolean).join(' · ')}
                  </span>
                )}
              </span>
              <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ink-muted/60" />
            </button>
          </GroupedListItem>
        ))}
      </GroupedList>
    </section>
  );
}
