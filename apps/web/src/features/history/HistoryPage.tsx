import {
  formatSwissDate,
  toLocalDate,
  type Id,
  type OperationOutput,
  type Outcome,
  type ShareRecipient,
  type WasteReason,
} from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { useMoney, type Money } from '../../app/money';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { formatQuantity } from '../../ui/quantity-text';
import { periodStart, type Period } from '../reports/period';

type Entry = OperationOutput<'inventory.history'>['outcomes'][number];
interface Edit {
  outcome: Outcome;
  wasteReason?: WasteReason;
  sharedWith?: ShareRecipient;
}
type Mode = { eventId: Id; kind: 'remove' } | ({ eventId: Id; kind: 'edit' } & Edit);

const t = messages.history;
const periodOptions = (Object.keys(messages.history.periods) as Period[]).map((value) => ({
  value,
  label: messages.history.periods[value],
}));
const TONES = { eaten: 'text-basil-800', shared_out: 'text-basil-800', wasted: 'text-today' };

/** «Verwertet · 150 g · CHF 3.00» and «vergessen · 07.11.2026». */
function details(entry: Entry, money: Money): [string, string] {
  const value = `${money.format(entry.valueRappen)}${entry.valueEstimated ? ` (${t.estimated})` : ''}`;
  const why =
    entry.wasteReason === undefined
      ? entry.sharedWith === undefined
        ? undefined
        : messages.shareRecipients[entry.sharedWith]
      : messages.wasteReasons[entry.wasteReason];
  return [
    [formatQuantity(entry.quantity, entry.unit), value].join(' · '),
    [why, formatSwissDate(toLocalDate(entry.at))].filter(Boolean).join(' · '),
  ];
}

/**
 * «Verlauf» under «Mehr»: what was eaten, shared or thrown away, newest first, with its share of
 * the price. A wrong entry is corrected (eaten, shared, wasted, reason) or deleted with one
 * confirmation: then the amount goes back to the item and statistics, reports and «Deine Wirkung»
 * no longer count it.
 */
export function HistoryPage() {
  const { householdId, ids, inventory, today } = useAppData();
  const [period, setPeriod] = useState<Period>('month');
  const [mode, setMode] = useState<Mode | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const entries = useLiveQuery(
    async () =>
      (
        await inventory['inventory.history']({
          householdId,
          from: periodStart(period, today),
          to: today,
        })
      ).outcomes,
    [householdId, period, today],
  );

  async function run(action: () => Promise<string>) {
    setBusy(true);
    try {
      setStatus(await action());
      setMode(null);
    } catch {
      setStatus(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const remove = (entry: Entry) =>
    run(async () => {
      const result = await inventory['inventory.undoOutcome']({
        commandId: ids.next(),
        householdId,
        eventId: entry.eventId,
      });
      return result.quantity === 0 ? t.removed : t.removedBack(entry.name);
    });

  const change = (entry: Entry, edit: Edit) =>
    run(async () => {
      await inventory['inventory.changeOutcome']({
        commandId: ids.next(),
        householdId,
        eventId: entry.eventId,
        outcome: edit.outcome,
        ...(edit.outcome === 'wasted' && edit.wasteReason !== undefined
          ? { wasteReason: edit.wasteReason }
          : {}),
        ...(edit.outcome === 'shared_out' && edit.sharedWith !== undefined
          ? { sharedWith: edit.sharedWith }
          : {}),
      });
      return t.changed(entry.name, messages.itemDetail.outcomes[edit.outcome]);
    });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <BackLink to="/more" label={messages.pages.more} />
        <h1 className="large-title">{messages.pages.history}</h1>
      </div>
      <p className="text-ink-muted">{t.intro}</p>
      <ChoiceChips
        legend={t.periodLegend}
        hideLegend
        options={periodOptions}
        value={period}
        onChange={setPeriod}
        segmented
      />
      <p role="status" className="font-semibold text-basil-800 empty:hidden">
        {status}
      </p>
      {entries === undefined ? null : entries.length === 0 ? (
        <Card>
          <p className="text-ink-muted">{t.empty}</p>
        </Card>
      ) : (
        <GroupedList>
          {entries.map((entry) => (
            <HistoryRow
              key={entry.eventId}
              entry={entry}
              mode={mode?.eventId === entry.eventId ? mode : null}
              busy={busy}
              onMode={(next) => {
                setStatus('');
                setMode(next);
              }}
              onRemove={() => void remove(entry)}
              onChange={(edit) => void change(entry, edit)}
            />
          ))}
        </GroupedList>
      )}
    </div>
  );
}

const outcomeOptions = (['eaten', 'shared_out', 'wasted'] as const).map((value) => ({
  value,
  label: messages.itemDetail.outcomes[value],
}));
const reasonOptions = (Object.keys(messages.wasteReasons) as WasteReason[]).map((value) => ({
  value,
  label: messages.wasteReasons[value],
}));
const recipientOptions = (Object.keys(messages.shareRecipients) as ShareRecipient[]).map(
  (value) => ({ value, label: messages.shareRecipients[value] }),
);

/** One entry: what happened, then «Ändern» and «Löschen», each opening below the row. */
function HistoryRow({
  entry,
  mode,
  busy,
  onMode,
  onRemove,
  onChange,
}: {
  entry: Entry;
  mode: Mode | null;
  busy: boolean;
  onMode: (mode: Mode | null) => void;
  onRemove: () => void;
  onChange: (edit: Edit) => void;
}) {
  const money = useMoney();
  const [amount, why] = details(entry, money);
  const cancel = (
    <Button
      variant="secondary"
      disabled={busy}
      onClick={() => {
        onMode(null);
      }}
    >
      {t.cancel}
    </Button>
  );
  return (
    <GroupedListItem inset="text" className="py-2.5 pr-2 pl-4">
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <p className="font-semibold break-words">{entry.name}</p>
          <p className="text-sm">
            <span className={`font-semibold ${TONES[entry.outcome]}`}>
              {messages.itemDetail.outcomes[entry.outcome]}
            </span>
            <span className="text-ink-muted"> · {amount}</span>
          </p>
          <p className="text-sm text-ink-muted">{why}</p>
        </div>
        {mode === null ? (
          <>
            <Button
              variant="ghost"
              icon={Pencil}
              aria-label={t.changeLabel(entry.name)}
              disabled={busy}
              onClick={() => {
                onMode({
                  eventId: entry.eventId,
                  kind: 'edit',
                  outcome: entry.outcome,
                  ...(entry.wasteReason === undefined ? {} : { wasteReason: entry.wasteReason }),
                  ...(entry.sharedWith === undefined ? {} : { sharedWith: entry.sharedWith }),
                });
              }}
            />
            <Button
              variant="ghost"
              icon={Trash2}
              aria-label={t.removeLabel(entry.name)}
              disabled={busy}
              className="text-danger hover:bg-today-bg"
              onClick={() => {
                onMode({ eventId: entry.eventId, kind: 'remove' });
              }}
            />
          </>
        ) : null}
      </div>
      {mode?.kind === 'remove' ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="danger" icon={Trash2} disabled={busy} onClick={onRemove}>
            {t.confirm}
          </Button>
          {cancel}
        </div>
      ) : null}
      {mode?.kind === 'edit' ? (
        <div className="mt-3 space-y-3 pr-2">
          <ChoiceChips
            legend={messages.itemDetail.whatHappened}
            options={outcomeOptions}
            value={mode.outcome}
            onChange={(outcome) => {
              onMode({ eventId: mode.eventId, kind: 'edit', outcome });
            }}
          />
          {mode.outcome === 'wasted' ? (
            <ChoiceChips
              legend={t.reason}
              options={reasonOptions}
              value={mode.wasteReason ?? null}
              onChange={(wasteReason) => {
                onMode({ ...mode, wasteReason });
              }}
            />
          ) : null}
          {mode.outcome === 'shared_out' ? (
            <ChoiceChips
              legend={t.recipient}
              options={recipientOptions}
              value={mode.sharedWith ?? null}
              onChange={(sharedWith) => {
                onMode({ ...mode, sharedWith });
              }}
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={() => {
                onChange(mode);
              }}
            >
              {t.save}
            </Button>
            {cancel}
          </div>
        </div>
      ) : null}
    </GroupedListItem>
  );
}
