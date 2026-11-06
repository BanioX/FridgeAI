import { categoryById, fallbackCategory, type OperationOutput } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';

export type FoundProduct = OperationOutput<'products.search'>['products'][number];

const t = messages.nameSearch;

/**
 * Product search under «Was ist es?» (ADR-0024):
 * - «Bereits verwendet»: products this household already entered, live while typing, on the
 *   device only;
 * - «… suchen»: also Open Food Facts (Switzerland), only on a tap (rate limit, nothing
 *   half-typed leaves the device).
 */
export function NameSearch({
  query,
  onPick,
}: {
  query: string;
  onPick: (product: FoundProduct) => void;
}) {
  const { householdId, inventory } = useAppData();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OperationOutput<'products.search'> | null>(null);
  const [searched, setSearched] = useState('');
  const words = query.trim().replace(/\s+/g, ' ');
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

  if (words.length < 2) {
    return null;
  }

  async function search() {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      setResult(await inventory['products.search']({ householdId, query: words }));
    } catch {
      setResult({ products: [], openDatabase: 'unavailable' });
    } finally {
      setSearched(words);
      setBusy(false);
    }
  }

  const pick = (product: FoundProduct) => {
    setResult(null);
    onPick(product);
  };
  const current = result !== null && searched === words ? result : null;

  return (
    <div className="space-y-2">
      {current === null && used !== undefined && used.length > 0 ? (
        <section aria-labelledby="used-title" className="space-y-1.5 pt-1">
          <h3 id="used-title" className="text-sm font-semibold text-ink-muted">
            {t.used}
          </h3>
          <FoundList products={used} onPick={pick} markOwn={false} />
        </section>
      ) : null}
      <Button
        variant="ghost"
        icon={Search}
        disabled={busy}
        className="-ml-3"
        onClick={() => void search()}
      >
        {busy ? t.searching : t.search(words)}
      </Button>
      {current === null ? null : (
        <div className="space-y-2">
          {current.products.length > 0 ? (
            <FoundList products={current.products} onPick={pick} />
          ) : null}
          <p role="status" className="text-sm text-ink-muted">
            {current.openDatabase === 'unavailable'
              ? t.unavailable
              : current.products.length === 0
                ? t.none
                : t.attribution}
          </p>
        </div>
      )}
    </div>
  );
}

function FoundList({
  products,
  onPick,
  markOwn = true,
}: {
  products: readonly FoundProduct[];
  onPick: (product: FoundProduct) => void;
  /** «schon erfasst» next to own products; not needed in the «Bereits verwendet» list. */
  markOwn?: boolean;
}) {
  return (
    <GroupedList>
      {products.map((product) => (
        <GroupedListItem key={`${product.source}-${product.gtin ?? product.name}`}>
          <button
            type="button"
            onClick={() => {
              onPick(product);
            }}
            className="flex min-h-14 w-full items-center gap-3 py-2 pr-3 pl-4 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2"
          >
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center text-2xl">
              {(categoryById(product.categoryId) ?? fallbackCategory()).emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{product.name}</span>
              <span className="block truncate text-sm text-ink-muted">
                {[
                  product.brand,
                  product.packSize,
                  markOwn && product.source === 'household' ? t.own : undefined,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ink-muted/60" />
          </button>
        </GroupedListItem>
      ))}
    </GroupedList>
  );
}
