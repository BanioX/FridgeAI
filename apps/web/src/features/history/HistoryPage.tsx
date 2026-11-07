import {
  formatChf,
  formatSwissDate,
  toLocalDate,
  type Id,
  type OperationOutput,
} from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { formatQuantity } from '../../ui/quantity-text';
import { periodStart, type Period } from '../reports/period';

type Entry = OperationOutput<'inventory.history'>['outcomes'][number];

const t = messages.history;
const periodOptions = (Object.keys(messages.reports.periods) as Period[]).map((value) => ({
  value,
  label: messages.reports.periods[value],
}));
const TONES = { eaten: 'text-basil-800', shared_out: 'text-basil-800', wasted: 'text-today' };

/** «Gegessen · 150 g · CHF 3.00» and «vergessen · 07.11.2026». */
function details(entry: Entry): [string, string] {
  const value = `${formatChf(entry.valueRappen)}${entry.valueEstimated ? ` (${t.estimated})` : ''}`;
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
 * the price. A wrong entry is deleted with one confirmation: the amount goes back to the item and
 * statistics, reports and «Deine Wirkung» no longer count it.
 */
export function HistoryPage() {
  const { householdId, ids, inventory, today } = useAppData();
  const [period, setPeriod] = useState<Period>('month');
  const [confirming, setConfirming] = useState<Id | null>(null);
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

  async function remove(entry: Entry) {
    setBusy(true);
    try {
      const result = await inventory['inventory.undoOutcome']({
        commandId: ids.next(),
        householdId,
        eventId: entry.eventId,
      });
      setStatus(result.quantity === 0 ? t.removed : t.removedBack(entry.name));
    } catch {
      setStatus(t.failed);
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

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
          {entries.map((entry) => {
            const [amount, why] = details(entry);
            return (
              <GroupedListItem key={entry.eventId} inset="text" className="py-2.5 pr-2 pl-4">
                <div className="flex items-center gap-2">
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
                  {confirming === entry.eventId ? null : (
                    <Button
                      variant="ghost"
                      icon={Trash2}
                      aria-label={t.removeLabel(entry.name)}
                      disabled={busy}
                      className="text-danger hover:bg-today-bg"
                      onClick={() => {
                        setStatus('');
                        setConfirming(entry.eventId);
                      }}
                    />
                  )}
                </div>
                {confirming === entry.eventId ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      icon={Trash2}
                      disabled={busy}
                      onClick={() => void remove(entry)}
                    >
                      {t.confirm}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        setConfirming(null);
                      }}
                    >
                      {t.cancel}
                    </Button>
                  </div>
                ) : null}
              </GroupedListItem>
            );
          })}
        </GroupedList>
      )}
    </div>
  );
}
