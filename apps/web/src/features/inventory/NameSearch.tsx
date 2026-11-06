import { categoryById, fallbackCategory, type OperationOutput } from '@fridgeai/core';
import { ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';

export type FoundProduct = OperationOutput<'products.search'>['products'][number];

const t = messages.nameSearch;

/**
 * «Coop Gipfeli» suchen (ADR-0024): searches the household's products and Open Food Facts only
 * when the person taps, never while typing (rate limit, nothing half-typed leaves the device).
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

  const current = result !== null && searched === words ? result : null;

  return (
    <div className="space-y-2">
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
            <GroupedList>
              {current.products.map((product) => (
                <GroupedListItem key={`${product.source}-${product.gtin ?? product.name}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      onPick(product);
                    }}
                    className="flex min-h-14 w-full items-center gap-3 py-2 pr-3 pl-4 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center text-2xl"
                    >
                      {(categoryById(product.categoryId) ?? fallbackCategory()).emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{product.name}</span>
                      <span className="block truncate text-sm text-ink-muted">
                        {[
                          product.brand,
                          product.packSize,
                          product.source === 'household' ? t.own : undefined,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-ink-muted/60"
                    />
                  </button>
                </GroupedListItem>
              ))}
            </GroupedList>
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
