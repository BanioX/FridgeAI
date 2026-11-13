import type { LocalDate, OperationOutput } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';

const t = messages.restock;
type Suggestion = OperationOutput<'shopping.suggestions'>['suggestions'][number];

/** `2026-11-08` → `8.11.` */
function shortDay(date: LocalDate): string {
  const [, month = '', day = ''] = date.split('-');
  return `${Number(day)}.${Number(month)}.`;
}

/**
 * «Bald wieder nötig» (ADR-0070): products bought at a steady rhythm that are gone at home. One tap
 * puts one on the shopping list. The query reads the same tables as the list, so a suggestion
 * disappears as soon as it is on the list. Hidden when there is nothing to suggest.
 */
export function RestockSuggestions() {
  const { householdId, ids, shopping } = useAppData();
  const headingId = useId();
  const [failed, setFailed] = useState(false);
  const suggestions = useLiveQuery(
    async () => (await shopping['shopping.suggestions']({ householdId })).suggestions,
    [householdId],
  );

  if (suggestions === undefined || suggestions.length === 0) {
    return null;
  }

  async function put(suggestion: Suggestion) {
    setFailed(false);
    try {
      await shopping['shopping.addItem']({
        commandId: ids.next(),
        householdId,
        name: suggestion.name,
      });
    } catch {
      setFailed(true);
    }
  }

  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <Card className="space-y-3">
        <div>
          <h2 id={headingId} className="font-display text-xl font-semibold">
            {t.title}
          </h2>
          <p className="text-sm text-ink-muted">{t.help}</p>
        </div>
        <ul className="divide-y divide-line">
          {suggestions.map((suggestion) => (
            <li key={suggestion.productId} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{suggestion.name}</p>
                <p className="text-sm text-ink-muted">
                  {t.rhythm(suggestion.everyDays, shortDay(suggestion.lastBought))}
                </p>
              </div>
              <button
                type="button"
                aria-label={t.addLabel(suggestion.name)}
                onClick={() => {
                  void put(suggestion);
                }}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-basil-700 hover:bg-basil-50"
              >
                <Plus size={18} aria-hidden="true" />
                {t.add}
              </button>
            </li>
          ))}
        </ul>
        {failed ? (
          <p role="status" className="text-sm font-semibold text-basil-800">
            {t.failed}
          </p>
        ) : null}
      </Card>
    </section>
  );
}
