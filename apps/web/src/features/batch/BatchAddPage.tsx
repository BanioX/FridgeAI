import { formatSwissDate } from '@fridgeai/core';
import { ListPlus, X } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { formatQuantity } from '../../ui/quantity-text';
import { batchRows } from './batch-rows';
import { FoodIcon } from '../../ui/FoodIcon';

const t = messages.batchAdd;

/**
 * «Mehrere auf einmal» (ADR-0072): one typed or dictated sentence becomes several articles. The
 * parser is the shopping list's; category, location, amount and date are the single form's.
 */
export function BatchAddPage() {
  const { householdId, ids, inventory, today } = useAppData();
  const navigate = useNavigate();
  const id = useId();
  const [text, setText] = useState('');
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  // A retry after a partial failure reuses the command ids, so nothing is added twice.
  const commandIds = useRef(new Map<string, string>());

  const rows = useMemo(
    () => batchRows(text, today).filter((row) => !removed.has(row.key)),
    [text, today, removed],
  );

  async function submit() {
    if (rows.length === 0 || busy) {
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const itemIds: string[] = [];
      for (const row of rows) {
        const commandId = commandIds.current.get(row.key) ?? ids.next();
        commandIds.current.set(row.key, commandId);
        const { itemId } = await inventory['inventory.addItem']({
          commandId,
          householdId,
          name: row.name,
          categoryId: row.categoryId,
          location: row.location,
          quantity: row.quantity,
          unit: row.unit,
          ...(row.container === undefined ? {} : { container: row.container }),
          ...(row.piecesPerPack === undefined ? {} : { piecesPerPack: row.piecesPerPack }),
        });
        itemIds.push(itemId);
      }
      commandIds.current.clear();
      void navigate(
        `/inventory/put-away?${new URLSearchParams(itemIds.map((item) => ['item', item])).toString()}`,
      );
    } catch {
      setStatus(t.failed);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <BackLink to="/add" label={messages.pages.add} />
        <h1 className="large-title">{t.title}</h1>
      </div>

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label htmlFor={`${id}-text`} className="font-semibold">
          {t.what}
        </label>
        <textarea
          id={`${id}-text`}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setRemoved(new Set());
          }}
          placeholder={t.placeholder}
          aria-describedby={`${id}-hint`}
          autoComplete="off"
          rows={3}
          maxLength={500}
          className="min-h-24 w-full rounded-xl border border-line bg-surface px-4 py-3 text-lg outline-none focus:border-basil-600"
        />
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {t.hint}
        </p>

        {rows.length === 0 ? (
          <Card variant="tip" className="text-sm">
            {t.empty}
          </Card>
        ) : (
          <section aria-labelledby={`${id}-preview`} className="space-y-2">
            <h2 id={`${id}-preview`} className="font-semibold">
              {t.previewTitle}
            </h2>
            <ul className="divide-y divide-line rounded-2xl bg-surface shadow-card">
              {rows.map((row) => (
                <li key={row.key} className="flex items-center gap-3 px-4 py-3">
                  <FoodIcon categoryId={row.categoryId} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {row.name}
                      <span className="font-normal text-ink-muted">
                        {' '}
                        · {formatQuantity(row.quantity, row.unit)}
                      </span>
                    </span>
                    <span className="block text-sm text-ink-muted">
                      {messages.locations[row.location]} ·{' '}
                      {t.expires(formatSwissDate(row.expiresOn))}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={t.removeNamed(row.name)}
                    title={t.remove}
                    onClick={() => {
                      setRemoved((previous) => new Set(previous).add(row.key));
                    }}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-basil-600"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Button type="submit" icon={ListPlus} fullWidth disabled={busy || rows.length === 0}>
          {t.submit(rows.length)}
        </Button>
        <p role="status" className="min-h-6 font-semibold text-danger">
          {status}
        </p>
      </form>
    </div>
  );
}
