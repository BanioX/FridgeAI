import {
  parseShoppingText,
  shoppingTips,
  toBaseQuantity,
  type Id,
  type OperationOutput,
} from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { PackagePlus, Plus, Share, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { describeDate } from '../../ui/date-text';
import { formatQuantity } from '../../ui/quantity-text';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { shareText, shoppingListText } from './share-list';

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
  const { householdId, ids, shopping, inventory } = useAppData();
  const id = useId();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const entries = useLiveQuery(
    async () => (await shopping['shopping.list']({ householdId, includeChecked: true })).items,
    [householdId],
  );

  /** K5: what the household often throws away; only a hint, so a failure just hides it. */
  const [habits, setHabits] = useState<OperationOutput<'products.wasteHabits'>['habits']>([]);
  useEffect(() => {
    let active = true;
    inventory['products.wasteHabits']({ householdId })
      .then(({ habits: found }) => {
        if (active) {
          setHabits(found);
        }
      })
      .catch(() => {
        // Only a hint.
      });
    return () => {
      active = false;
    };
  }, [householdId, inventory]);

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
      const lines = parseShoppingText(name);
      if (lines.length === 0) {
        return null;
      }
      const results: { name: string; result: OperationOutput<'shopping.addItem'> }[] = [];
      for (const line of lines) {
        const base =
          line.quantity === undefined || line.unit === undefined
            ? {}
            : toBaseQuantity(line.quantity, line.unit);
        const result = await shopping['shopping.addItem']({
          commandId: ids.next(),
          householdId,
          name: line.name,
          ...base,
        });
        results.push({ name: line.name, result });
      }
      setName('');
      const first = results[0];
      if (results.length === 1 && first !== undefined) {
        const said = first.result.alreadyOnList ? t.onList(first.name) : t.added(first.name);
        return first.result.atHome === undefined
          ? said
          : `${said} ${atHomeText(first.result.atHome)}`;
      }
      const fresh = results.filter((entry) => !entry.result.alreadyOnList);
      const known = results.length - fresh.length;
      const parts = [fresh.length === 0 ? t.allOnList : t.addedMany(fresh.length)];
      if (known > 0 && fresh.length > 0) {
        parts.push(t.onListSome(known));
      }
      for (const entry of fresh) {
        if (entry.result.atHome !== undefined) {
          parts.push(atHomeText(entry.result.atHome));
        }
      }
      return parts.join(' ');
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

  const tips = shoppingTips({ entries: entries ?? [], habits });
  const shareList = async () => {
    const text = shoppingListText(t.shareTitle, entries ?? []);
    const outcome = await shareText(text);
    if (outcome === 'copied') {
      setStatus(t.copied);
    } else if (outcome === 'failed') {
      setStatus(t.shareFailed);
    }
  };

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
            {entry.quantity === undefined || entry.unit === undefined ? null : (
              <span className="ml-2 font-normal text-ink-muted">
                {formatQuantity(entry.quantity, entry.unit)}
              </span>
            )}
          </span>
          {entry.atHome === undefined ? null : (
            <span className="block text-sm text-ink-muted">
              {t.stillThere(
                formatQuantity(entry.atHome.quantity, entry.atHome.unit),
                describeDate(entry.atHome.expiresOn),
                // Where it lies: the remembered spot, else the storage location (ADR-0056).
                entry.atHome.spot ??
                  (entry.atHome.location === undefined
                    ? undefined
                    : messages.locations[entry.atHome.location]),
              )}
            </span>
          )}
        </label>
        {tips.has(entry.id) ? (
          <p className="text-sm text-ink-muted">{t.oftenThrown(tips.get(entry.id)?.tip)}</p>
        ) : null}
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
      <div>
        <BackLink to="/more" label={messages.pages.more} />
        <h1 className="large-title">{messages.pages.shopping}</h1>
      </div>

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
        <textarea
          id={`${id}-name`}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
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
        <Button
          type="submit"
          icon={Plus}
          fullWidth
          disabled={busy || parseShoppingText(name).length === 0}
        >
          {t.add}
        </Button>
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
              <Button
                variant="secondary"
                icon={Share}
                fullWidth
                onClick={() => {
                  void shareList();
                }}
              >
                {t.share}
              </Button>
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
