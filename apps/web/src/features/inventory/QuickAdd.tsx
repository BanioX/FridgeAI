import type { FrequentProduct, Id } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { formatQuantity } from '../../ui/quantity-text';
import { FoodIcon } from '../../ui/FoodIcon';

const t = messages.quickAdd;

/**
 * «Schnell erfassen» (UC-07): the household's usual products as chips. One tap saves the product
 * with the amount and place of last time and an estimated date; «Rückgängig» deletes it again.
 */
export function QuickAdd() {
  const { householdId, ids, inventory } = useAppData();
  const products = useLiveQuery(
    async () => (await inventory['products.frequent']({ householdId })).products,
    [householdId],
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [added, setAdded] = useState<{ itemId: Id; name: string } | null>(null);

  if (products === undefined || products.length === 0) {
    return null;
  }

  async function run(action: () => Promise<void>) {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await action();
    } catch {
      setAdded(null);
      setStatus(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const add = (product: FrequentProduct) =>
    run(async () => {
      const { itemId } = await inventory['inventory.addItem']({
        commandId: ids.next(),
        householdId,
        name: product.name,
        categoryId: product.categoryId,
        location: product.location,
        quantity: product.quantity,
        unit: product.unit,
        ...(product.container === undefined ? {} : { container: product.container }),
        ...(product.gtin === undefined ? {} : { gtin: product.gtin }),
      });
      setAdded({ itemId, name: product.name });
      setStatus(
        t.saved(
          product.name,
          formatQuantity(product.quantity, product.unit),
          messages.locations[product.location],
        ),
      );
    });

  const undo = (item: { itemId: Id; name: string }) =>
    run(async () => {
      await inventory['inventory.deleteItem']({
        commandId: ids.next(),
        householdId,
        itemId: item.itemId,
      });
      setAdded(null);
      setStatus(t.undone(item.name));
    });

  return (
    <section aria-labelledby="quick-add-title" className="space-y-2">
      <h2 id="quick-add-title" className="font-semibold">
        {t.title}
      </h2>
      <p className="text-sm text-ink-muted">{t.hint}</p>
      {/* One row that scrolls sideways (iOS suggestions), so the form stays close. */}
      {/* relative: the screen-reader texts in the chips are positioned absolutely; without a
          positioned scroller they escape it and make the whole page scroll sideways. */}
      <ul className="relative -mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {products.map((product) => (
          <li key={`${product.name}-${product.categoryId}`} className="shrink-0 snap-start">
            <button
              type="button"
              disabled={busy}
              onClick={() => void add(product)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              <Plus size={16} aria-hidden="true" className="text-basil-700" />
              <FoodIcon categoryId={product.categoryId} size="xs" />
              {product.name}{' '}
              <span className="font-normal text-ink-muted">
                {formatQuantity(product.quantity, product.unit)}
              </span>
              <span className="sr-only"> {t.add}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-3">
        <p role="status" className="font-semibold text-basil-800">
          {status}
        </p>
        {added === null ? null : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void undo(added)}
            className="min-h-11 rounded-xl px-2 font-semibold text-basil-800 underline underline-offset-4 hover:bg-basil-50"
          >
            {messages.inventory.undo}
          </button>
        )}
      </div>
    </section>
  );
}
