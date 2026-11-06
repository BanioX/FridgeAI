import { halfOf, type Id } from '@fridgeai/core';
import { CookingPot, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { formatQuantity } from '../../ui/quantity-text';
import { defaultChoice, type CookedChoice, type UsedFood } from './cooked';

const t = messages.recipes.cooked;

/**
 * «Gekocht? Zutaten abbuchen» (R-03, ADR-0023): after cooking, mark what was used, all or half,
 * as eaten. Uses `inventory.recordOutcome`, so the impact card counts it; «Rückgängig» undoes all.
 */
export function CookedBooking({ food }: { food: readonly UsedFood[] }) {
  const { householdId, ids, inventory, today } = useAppData();
  // A snapshot: booking changes what is at home, the list stays as it was when opened.
  const [open, setOpen] = useState<readonly UsedFood[] | null>(null);
  const [choices, setChoices] = useState<Record<string, CookedChoice>>({});
  const [booked, setBooked] = useState<Id[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  if (food.length === 0 && open === null && booked.length === 0 && status === '') {
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
      setStatus(t.failed);
    } finally {
      setBusy(false);
    }
  }

  function start() {
    setOpen(food);
    setChoices(
      Object.fromEntries(food.map((entry) => [entry.itemId, defaultChoice(entry, today)])),
    );
    setBooked([]);
    setStatus('');
  }

  const book = (list: readonly UsedFood[]) =>
    run(async () => {
      const events: Id[] = [];
      for (const entry of list) {
        const choice = choices[entry.itemId] ?? 'none';
        const half = choice === 'half' ? halfOf(entry.quantity, entry.unit) : null;
        if (choice === 'none' || (choice === 'half' && half === null)) {
          continue;
        }
        const result = await inventory['inventory.recordOutcome']({
          commandId: ids.next(),
          householdId,
          itemId: entry.itemId,
          outcome: 'eaten',
          ...(half === null ? {} : { quantity: half }),
        });
        events.push(result.eventId);
      }
      setBooked(events);
      setOpen(null);
      setStatus(t.booked(events.length));
    });

  const undo = () =>
    run(async () => {
      for (const eventId of booked) {
        await inventory['inventory.undoOutcome']({ commandId: ids.next(), householdId, eventId });
      }
      setBooked([]);
      setStatus(t.undone);
    });

  return (
    <section aria-labelledby="cooked-title" className="space-y-3">
      <h2 id="cooked-title" className="text-xl font-semibold">
        {t.title}
      </h2>
      {open === null ? (
        <>
          <p className="text-ink-muted">{t.text}</p>
          {food.length > 0 ? (
            <Button variant="secondary" icon={CookingPot} fullWidth onClick={start}>
              {t.start}
            </Button>
          ) : null}
        </>
      ) : (
        <Card className="space-y-5">
          {open.map((entry) => {
            const options = [
              { value: 'all' as const, label: t.all },
              ...(halfOf(entry.quantity, entry.unit) === null
                ? []
                : [{ value: 'half' as const, label: t.half }]),
              { value: 'none' as const, label: t.none },
            ];
            return (
              <ChoiceChips
                key={entry.itemId}
                legend={`${entry.name} · ${formatQuantity(entry.quantity, entry.unit)}`}
                segmented
                options={options}
                value={choices[entry.itemId] ?? 'none'}
                onChange={(value) => {
                  setChoices((current) => ({ ...current, [entry.itemId]: value }));
                }}
              />
            );
          })}
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void book(open)}>
              {t.book}
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setOpen(null);
              }}
            >
              {t.cancel}
            </Button>
          </div>
        </Card>
      )}
      <div className="flex flex-wrap items-center gap-x-3">
        <p role="status" className="font-semibold text-basil-800">
          {status}
        </p>
        {booked.length > 0 ? (
          <Button variant="ghost" icon={Undo2} disabled={busy} onClick={() => void undo()}>
            {messages.inventory.undo}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
