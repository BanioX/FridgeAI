import {
  expiryStatus,
  rappen,
  soonThresholdFor,
  startOfMonth,
  StorageLocationSchema,
  type Id,
  type StorageLocation,
} from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, ShoppingBasket, Undo2 } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { SwipeAction } from '../../ui/SwipeAction';
import { Card } from '../../ui/Card';
import { expiryBadge } from '../../ui/expiry-badge';
import { closedItemFrom } from './closed-item';
import { factFor } from '../knowledge/food-facts';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { InventoryItemRow } from './InventoryItemRow';
import { locationOrder } from './item-meta';
import { SelectableRow } from './SelectableRow';
import { SelectionBar } from './SelectionBar';
import { useMoveSelected } from './use-move-selected';
import { useSelection } from './use-selection';
import { SWIPE_HINT_ID, useSwipeOutcome } from './swipe-outcome';

const tabId = (location: StorageLocation) => `tab-${location}`;
const panelId = (location: StorageLocation) => `panel-${location}`;

/**
 * After an item was closed on its detail page: «Mozzarella: als verwertet gespeichert.» with undo
 * and, once it is used up or gone, «Nachkaufen» with one tap (ADR-0031). The notice lives in the
 * history entry, so it disappears once the person moves on.
 */
function ClosedNotice() {
  const { householdId, ids, inventory, shopping, today } = useAppData();
  const money = useMoney();
  const location = useLocation();
  const navigate = useNavigate();
  const closed = closedItemFrom(location.state);
  // After a confirmed rescue: what it was worth and this month's total (ADR-0042).
  const rescuedRappen =
    closed !== null && closed.kind === 'outcome' ? closed.rescuedRappen : undefined;
  const month = useLiveQuery(
    () =>
      rescuedRappen === undefined
        ? Promise.resolve(undefined)
        : inventory['stats.waste']({ householdId, from: startOfMonth(today), to: today }),
    [householdId, inventory, rescuedRappen, today],
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  // Tied to the closed entry it answers: the next closed item starts without it.
  const [rebuyNote, setRebuyNote] = useState<{ id: Id; text: string; done: boolean } | null>(null);
  const t = messages.inventory;
  const closedId =
    closed === null ? null : closed.kind === 'deleted' ? closed.itemId : closed.eventId;
  const note = rebuyNote !== null && rebuyNote.id === closedId ? rebuyNote : null;

  const rebuy = async () => {
    if (closed === null || closed.kind === 'deleted' || busy) {
      return;
    }
    setBusy(true);
    try {
      const result = await shopping['shopping.addItem']({
        commandId: ids.next(),
        householdId,
        name: closed.name.slice(0, 80),
      });
      setRebuyNote({
        id: closed.eventId,
        text: result.alreadyOnList ? t.rebuyAlready(closed.name) : t.rebought(closed.name),
        done: true,
      });
    } catch {
      setRebuyNote({ id: closed.eventId, text: t.rebuyFailed, done: false });
    } finally {
      setBusy(false);
    }
  };

  const undo = async () => {
    if (closed === null || busy) {
      return;
    }
    setBusy(true);
    try {
      if (closed.kind === 'deleted') {
        await inventory['inventory.restoreItem']({
          commandId: ids.next(),
          householdId,
          itemId: closed.itemId,
        });
      } else {
        await inventory['inventory.undoOutcome']({
          commandId: ids.next(),
          householdId,
          eventId: closed.eventId,
        });
      }
      setMessage(t.undone(closed.name));
      void navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    } catch {
      setMessage(t.undoFailed);
    } finally {
      setBusy(false);
    }
  };

  const text =
    closed === null
      ? message
      : note !== null
        ? note.text
        : closed.kind === 'deleted'
          ? t.deleted(closed.name)
          : closed.rescuedRappen !== undefined
            ? t.rescued(
                closed.name,
                money.format(rappen(closed.rescuedRappen)),
                closed.estimated === true,
              )
            : t.closed[closed.outcome](closed.name);
  if (text === '') {
    return null;
  }
  // The card stays mounted from «gespeichert» to «wieder im Vorrat», so the change is announced.
  return (
    <Card variant="tip" className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="min-w-0 flex-1">
        <p role="status" className="font-semibold">
          {text}
        </p>
        {closed?.kind === 'outcome' && closed.rescuedRappen !== undefined && note === null ? (
          <>
            {month === undefined ? null : (
              <p className="text-sm">{t.monthSaved(money.format(month.savedRappen))}</p>
            )}
            <p className="mt-2 text-sm text-ink-muted">
              <strong>{messages.knowledge.didYouKnow}</strong> {factFor(closed.eventId)}
            </p>
          </>
        ) : null}
      </div>
      {closed === null ? null : (
        <div className="flex flex-wrap gap-1">
          {closed.kind === 'deleted' || note?.done === true ? null : (
            <Button
              variant="ghost"
              icon={ShoppingBasket}
              disabled={busy}
              onClick={() => {
                void rebuy();
              }}
            >
              {t.rebuy}
            </Button>
          )}
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
        </div>
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

  const swipe = useSwipeOutcome();
  const selection = useSelection(selected);
  const mover = useMoveSelected();

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
  // Only what is listed counts: an item that left the tab cannot stay selected.
  const chosen = visible.filter((item) => selection.ids.has(item.id));
  const allChosen = visible.length > 0 && chosen.length === visible.length;

  const moveChosen = async (to: StorageLocation) => {
    if (mover.busy || chosen.length === 0) {
      return;
    }
    if (await mover.move(chosen, to)) {
      selection.stop();
    }
  };

  return (
    <div className={`space-y-5 ${chosen.length > 0 ? 'pb-44' : 'pb-8'}`}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="large-title">{messages.pages.inventory}</h1>
        <button
          type="button"
          onClick={selection.active ? selection.stop : selection.start}
          className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-2 font-semibold text-basil-700 transition-colors hover:bg-surface-muted"
        >
          {selection.active ? t.select.done : t.select.enter}
        </button>
      </div>

      <ClosedNotice />

      <div
        role="tablist"
        aria-label={t.tabsLabel}
        className="grid grid-cols-4 gap-0.5 rounded-xl bg-surface-muted p-0.5"
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
              className={`flex min-h-12 min-w-0 flex-col items-center justify-center rounded-[0.625rem] px-1 text-center text-[0.8125rem] leading-tight hyphens-auto transition-colors ${
                active
                  ? 'bg-basil-700 font-semibold text-white shadow-card'
                  : 'font-medium text-ink hover:bg-surface'
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
            <Link
              to={`/inventory/new?location=${selected}`}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-basil-700 px-5 font-semibold text-white transition-colors hover:bg-basil-800 active:bg-basil-900"
            >
              <Plus size={20} aria-hidden="true" />
              {t.add}
            </Link>
            {selected === 'reserve' ? <Card variant="tip">{t.reserveTip}</Card> : null}
          </div>
        ) : (
          <div className="space-y-2">
            {selection.active ? (
              <button
                type="button"
                onClick={() => {
                  if (allChosen) {
                    selection.clear();
                  } else {
                    selection.selectAll(visible.map((item) => item.id));
                  }
                }}
                className="inline-flex min-h-11 items-center rounded-xl font-semibold text-basil-700"
              >
                {allChosen ? t.select.none : t.select.all}
              </button>
            ) : (
              swipe.tip
            )}
            <GroupedList>
              {visible.map((item) => {
                const status = expiryBadge(
                  expiryStatus(
                    item.expiresOn,
                    today,
                    item.expiryKind,
                    soonThresholdFor(item.location),
                  ),
                  item.expiresOn,
                  today,
                  item.location,
                );
                if (selection.active) {
                  const picked = selection.ids.has(item.id);
                  return (
                    <GroupedListItem
                      key={item.id}
                      inset="check"
                      className={picked ? 'bg-basil-50' : ''}
                    >
                      <SelectableRow
                        name={item.name}
                        selected={picked}
                        onToggle={() => {
                          selection.toggle(item.id);
                        }}
                      >
                        <InventoryItemRow item={item} status={status} />
                      </SelectableRow>
                    </GroupedListItem>
                  );
                }
                return (
                  <GroupedListItem key={item.id}>
                    <SwipeAction {...swipe.sides(item)}>
                      {({ sliced }) => (
                        <Link
                          to={`/inventory/${item.id}`}
                          aria-describedby={SWIPE_HINT_ID}
                          className={GROUPED_ROW_LINK}
                        >
                          <InventoryItemRow chevron sliced={sliced} item={item} status={status} />
                        </Link>
                      )}
                    </SwipeAction>
                  </GroupedListItem>
                );
              })}
            </GroupedList>
          </div>
        )}
      </div>
      {swipe.toast}
      {mover.toast}
      {chosen.length > 0 ? (
        <SelectionBar
          count={chosen.length}
          from={selected}
          busy={mover.busy}
          onMove={(to) => {
            void moveChosen(to);
          }}
        />
      ) : null}
    </div>
  );
}
