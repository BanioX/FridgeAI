import {
  expiryStatus,
  soonThresholdFor,
  StorageLocationSchema,
  type StorageLocation,
} from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Undo2 } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ItemRow } from '../../ui/ItemRow';
import { expiryBadge } from '../../ui/expiry-badge';
import { closedItemFrom } from './closed-item';
import { itemMeta, locationOrder } from './item-meta';

const tabId = (location: StorageLocation) => `tab-${location}`;
const panelId = (location: StorageLocation) => `panel-${location}`;

/**
 * After an item was closed on its detail page: «Mozzarella: als gegessen gespeichert.» with undo.
 * The notice lives in the history entry, so it disappears once the person moves on.
 */
function ClosedNotice() {
  const { householdId, ids, inventory } = useAppData();
  const location = useLocation();
  const navigate = useNavigate();
  const closed = closedItemFrom(location.state);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const t = messages.inventory;

  const undo = async () => {
    if (closed === null || busy) {
      return;
    }
    setBusy(true);
    try {
      await inventory['inventory.undoOutcome']({
        commandId: ids.next(),
        householdId,
        eventId: closed.eventId,
      });
      setMessage(t.undone(closed.name));
      void navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    } catch {
      setMessage(t.undoFailed);
    } finally {
      setBusy(false);
    }
  };

  const text = closed === null ? message : t.closed[closed.outcome](closed.name);
  if (text === '') {
    return null;
  }
  // The card stays mounted from «gespeichert» to «wieder im Vorrat», so the change is announced.
  return (
    <Card variant="tip" className="flex flex-wrap items-center justify-between gap-2 py-3">
      <p role="status" className="font-semibold">
        {text}
      </p>
      {closed === null ? null : (
        <Button
          variant="ghost"
          icon={Undo2}
          disabled={busy}
          onClick={() => {
            void undo();
          }}
        >
          {t.undo}
        </Button>
      )}
    </Card>
  );
}

export function InventoryPage() {
  const { householdId, inventory, today } = useAppData();
  const [params, setParams] = useSearchParams();
  const tabRefs = useRef(new Map<StorageLocation, HTMLButtonElement>());

  const parsed = StorageLocationSchema.safeParse(params.get('location'));
  const selected: StorageLocation = parsed.success ? parsed.data : 'fridge';

  const items = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items,
    [householdId],
  );

  const select = (location: StorageLocation, focus = false) => {
    setParams({ location }, { replace: true });
    if (focus) {
      tabRefs.current.get(location)?.focus();
    }
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const last = locationOrder.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const target = targets[event.key];
    const location = target === undefined ? undefined : locationOrder[target];
    if (location !== undefined) {
      event.preventDefault();
      select(location, true);
    }
  };

  const countOf = (location: StorageLocation) =>
    items?.filter((item) => item.location === location).length ?? 0;
  const visible = items?.filter((item) => item.location === selected) ?? [];
  const t = messages.inventory;

  return (
    <div className="space-y-5 pb-20">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {messages.pages.inventory}
      </h1>

      <ClosedNotice />

      <div
        role="tablist"
        aria-label={t.tabsLabel}
        className="grid grid-cols-4 gap-1 rounded-2xl bg-surface-muted p-1"
      >
        {locationOrder.map((location, index) => {
          const active = location === selected;
          return (
            <button
              key={location}
              ref={(node) => {
                if (node === null) {
                  tabRefs.current.delete(location);
                } else {
                  tabRefs.current.set(location, node);
                }
              }}
              type="button"
              role="tab"
              id={tabId(location)}
              aria-selected={active}
              aria-controls={panelId(location)}
              tabIndex={active ? 0 : -1}
              onClick={() => {
                select(location);
              }}
              onKeyDown={(event) => {
                onKeyDown(event, index);
              }}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl px-1 text-sm transition-colors ${
                active
                  ? 'bg-surface font-semibold text-basil-800 shadow-card'
                  : 'font-medium text-ink-muted'
              }`}
            >
              <span>{messages.locations[location]}</span>
              <span className="text-xs tabular-nums">{countOf(location)}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={panelId(selected)} aria-labelledby={tabId(selected)} tabIndex={0}>
        {items === undefined ? (
          <p className="sr-only">{messages.loading}</p>
        ) : visible.length === 0 ? (
          <div className="space-y-4">
            <p className="text-ink-muted">{t.empty}</p>
            {selected === 'reserve' ? <Card variant="tip">{t.reserveTip}</Card> : null}
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/inventory/${item.id}`}
                  className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <ItemRow
                    emoji={item.emoji ?? ''}
                    name={item.name}
                    meta={itemMeta(item)}
                    status={expiryBadge(
                      expiryStatus(
                        item.expiresOn,
                        today,
                        item.expiryKind,
                        soonThresholdFor(item.location),
                      ),
                      item.expiresOn,
                      today,
                      item.location,
                    )}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to={`/inventory/new?location=${selected}`}
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-10 inline-flex min-h-12 items-center gap-2 rounded-full bg-basil-700 px-5 font-semibold text-white shadow-lg transition-colors hover:bg-basil-800 active:bg-basil-900"
      >
        <Plus size={20} aria-hidden="true" />
        {t.add}
      </Link>
    </div>
  );
}
