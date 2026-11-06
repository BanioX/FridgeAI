import type { Id, OperationOutput } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { PackagePlus, Plus, X } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { describeDate } from '../../ui/date-text';
import { formatQuantity } from '../../ui/quantity-text';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';

const t = messages.shopping;
type Entry = OperationOutput<'shopping.list'>['items'][number];
type AtHome = NonNullable<Entry['atHome']>;

/** «Du hast noch 1 l Bio Vollmilch (bis Fr., 13. Nov. 2026). Und 1 weiteres.» */
function atHomeText(home: AtHome): string {
  const text = t.atHome(
    formatQuantity(home.quantity, home.unit),
    home.name,
    describeDate(home.expiresOn),
  );
  return home.count > 1 ? `${text}${t.more(home.count - 1)}` : text;
}

/**
 * Shopping list (step 11a, US-08): add what is missing – with a hint if the same kind of food is
 * still at home (E-02) –, check it off into the basket and put bought things into the inventory.
 */
export function ShoppingPage() {
  const { householdId, ids, shopping } = useAppData();
  const id = useId();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const entries = useLiveQuery(
    async () => (await shopping['shopping.list']({ householdId, includeChecked: true })).items,
    [householdId],
  );

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    try {
      const message = await action();
      if (message !== null) {
        setStatus(message);
      }
    } catch {
      setStatus(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const add = () =>
    run(async () => {
      const wanted = name.trim();
      if (wanted === '') {
        return null;
      }
      const result = await shopping['shopping.addItem']({
        commandId: ids.next(),
        householdId,
        name: wanted,
      });
      setName('');
      const said = result.alreadyOnList ? t.onList(wanted) : t.added(wanted);
      return result.atHome === undefined ? said : `${said} ${atHomeText(result.atHome)}`;
    });

  const check = (itemId: Id, checked: boolean) =>
    run(async () => {
      await shopping['shopping.check']({ commandId: ids.next(), householdId, itemId, checked });
      return null;
    });

  const remove = (itemId: Id) =>
    run(async () => {
      await shopping['shopping.remove']({ commandId: ids.next(), householdId, itemId });
      return null;
    });

  const open = entries?.filter((entry) => !entry.checked) ?? [];
  const basket = entries?.filter((entry) => entry.checked) ?? [];

  const row = (entry: Entry) => (
    <GroupedListItem key={entry.id} inset="check" className="flex items-center gap-3 px-4 py-1">
      <input
        id={`${id}-${entry.id}`}
        type="checkbox"
        checked={entry.checked}
        disabled={busy}
        onChange={(event) => {
          void check(entry.id, event.target.checked);
        }}
        className="size-6 shrink-0 accent-basil-700"
      />
      <div className="min-w-0 flex-1 py-2">
        <label htmlFor={`${id}-${entry.id}`} className="block cursor-pointer">
          <span className={`font-semibold ${entry.checked ? 'text-ink-muted line-through' : ''}`}>
            {entry.emoji === undefined ? null : (
              <span aria-hidden="true" className="mr-2">
                {entry.emoji}
              </span>
            )}
            {entry.name}
          </span>
          {entry.atHome === undefined ? null : (
            <span className="block text-sm text-ink-muted">
              {t.stillThere(
                formatQuantity(entry.atHome.quantity, entry.atHome.unit),
                describeDate(entry.atHome.expiresOn),
              )}
            </span>
          )}
        </label>
        {/* Outside the label: tapping the link must not toggle the box. */}
        {entry.checked ? (
          <Link
            to={`/inventory/new?name=${encodeURIComponent(entry.name)}`}
            className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-1 text-sm font-semibold text-basil-700 hover:bg-basil-50"
          >
            <PackagePlus size={18} aria-hidden="true" />
            {t.toInventory}
          </Link>
        ) : null}
      </div>
      <button
        type="button"
        aria-label={t.remove(entry.name)}
        disabled={busy}
        onClick={() => {
          void remove(entry.id);
        }}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted"
      >
        <X size={20} aria-hidden="true" />
      </button>
    </GroupedListItem>
  );

  return (
    <div className="space-y-6">
      <h1 className="large-title">{messages.pages.shopping}</h1>

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <label htmlFor={`${id}-name`} className="font-semibold">
          {t.what}
        </label>
        <div className="flex gap-2">
          <input
            id={`${id}-name`}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            placeholder={t.placeholder}
            autoComplete="off"
            enterKeyHint="done"
            maxLength={80}
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 text-lg outline-none focus:border-basil-600"
          />
          <Button type="submit" icon={Plus} disabled={busy || name.trim() === ''}>
            {t.add}
          </Button>
        </div>
        <p role="status" className="min-h-6 font-semibold text-basil-800">
          {status}
        </p>
      </form>

      {entries === undefined ? (
        <p className="sr-only">{messages.loading}</p>
      ) : entries.length === 0 ? (
        <Card variant="tip">{t.empty}</Card>
      ) : (
        <>
          {open.length === 0 ? null : (
            <section aria-labelledby={`${id}-open`} className="space-y-2">
              <h2 id={`${id}-open`} className="font-display text-xl font-semibold">
                {t.open}
              </h2>
              <GroupedList>{open.map(row)}</GroupedList>
            </section>
          )}
          {basket.length === 0 ? null : (
            <section aria-labelledby={`${id}-basket`} className="space-y-2">
              <h2 id={`${id}-basket`} className="font-display text-xl font-semibold">
                {t.basket(basket.length)}
              </h2>
              <GroupedList>{basket.map(row)}</GroupedList>
            </section>
          )}
        </>
      )}
    </div>
  );
}
