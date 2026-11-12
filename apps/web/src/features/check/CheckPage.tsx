import {
  expiryStatus,
  halfOf,
  shouldAskStillGood,
  soonThresholdFor,
  type Id,
  type InventoryItemView,
  type LocalDate,
} from '@fridgeai/core';
import { MapPin, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { StatusChip } from '../../ui/StatusChip';
import { expiryBadge } from '../../ui/expiry-badge';
import { OwnerMark } from '../people/OwnerMark';
import { useMembers } from '../people/use-members';
import { itemMeta } from '../inventory/item-meta';
import { useProductImage } from '../inventory/use-product-image';
import { SpotThumb } from '../spots/SpotThumb';
import { useSpots } from '../spots/use-spots';
import { groupBySpot, spotCue } from './check-order';
import { checkQueue, tally, writeLastCheck, type CheckAnswer } from './check-state';

const t = messages.check;

interface Step {
  answer: CheckAnswer;
  /** The recorded outcome, so «Zurück» can undo it. */
  eventId?: Id;
}

/**
 * «Kühlschrank-Check» (UC-04, ADR-0022): one card per fridge item, one tap each – still there,
 * half gone, eaten or thrown away. Uses the normal outcome commands, so the impact card counts it.
 */
export function CheckPage() {
  const { householdId, ids, inventory, today } = useAppData();
  // A snapshot: answering changes the inventory, the check still walks through it exactly once.
  const [queue, setQueue] = useState<InventoryItemView[] | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const spots = useSpots();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    let active = true;
    void inventory['inventory.list']({ householdId }).then(({ items }) => {
      if (active) {
        setQueue(groupBySpot(checkQueue(items, today), Object.values(messages.spots.shelves)));
      }
    });
    return () => {
      active = false;
    };
  }, [householdId, inventory, today]);

  const finished = queue !== null && queue.length > 0 && steps.length === queue.length;
  // A finished check is reported once (event `check.completed`, for «Treu»); stepping back and
  // finishing again reports again.
  const reported = useRef(false);
  const itemCount = queue?.length ?? 0;
  useEffect(() => {
    if (!finished) {
      reported.current = false;
      return;
    }
    writeLastCheck(today);
    if (!reported.current) {
      reported.current = true;
      void inventory['inventory.completeCheck']({
        commandId: ids.next(),
        householdId,
        itemCount,
      }).catch(() => undefined);
    }
  }, [finished, today, inventory, ids, householdId, itemCount]);
  // After each answer the next card's name gets the focus, so screen readers read it out.
  useEffect(() => {
    if (moved.current) {
      heading.current?.focus();
    }
  }, [steps.length]);

  async function run(action: () => Promise<void>) {
    if (busy) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await action();
      moved.current = true;
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const answer = (item: InventoryItemView, choice: CheckAnswer) =>
    run(async () => {
      if (choice === 'still') {
        setSteps((previous) => [...previous, { answer: choice }]);
        return;
      }
      const half = halfOf(item.quantity, item.unit);
      if (choice === 'half' && half === null) {
        return;
      }
      const result = await inventory['inventory.recordOutcome']({
        commandId: ids.next(),
        householdId,
        itemId: item.id,
        outcome: choice === 'wasted' ? 'wasted' : 'eaten',
        ...(choice === 'half' && half !== null ? { quantity: half } : {}),
      });
      setSteps((previous) => [...previous, { answer: choice, eventId: result.eventId }]);
    });

  const back = () =>
    run(async () => {
      const last = steps.at(-1);
      if (last === undefined) {
        return;
      }
      if (last.eventId !== undefined) {
        await inventory['inventory.undoOutcome']({
          commandId: ids.next(),
          householdId,
          eventId: last.eventId,
        });
      }
      setSteps((previous) => previous.slice(0, -1));
    });

  if (queue === null) {
    return <p className="sr-only">{messages.loading}</p>;
  }
  const current = queue[steps.length];
  const cue = spotCue(queue, steps.length);
  const cuePhoto =
    cue === undefined || cue === null
      ? undefined
      : spots?.find((spot) => spot.id === cue.id)?.photo;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="large-title">{messages.pages.check}</h1>
        {finished || queue.length === 0 ? null : <p className="mt-1 text-ink-muted">{t.intro}</p>}
      </div>

      {queue.length === 0 ? (
        <Card variant="tip">{t.empty}</Card>
      ) : finished || current === undefined ? (
        <Card className="space-y-4">
          <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold">
            {t.doneTitle}
          </h2>
          <p>{t.summary(tally(steps.map((step) => step.answer)))}</p>
          <Link
            to="/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-basil-700 px-5 font-semibold text-white transition-colors hover:bg-basil-800 active:bg-basil-900"
          >
            {t.toToday}
          </Link>
        </Card>
      ) : (
        <CheckCard
          key={current.id}
          item={current}
          step={steps.length + 1}
          total={queue.length}
          today={today}
          busy={busy}
          heading={heading}
          cue={cue}
          cuePhoto={cuePhoto}
          onAnswer={(choice) => void answer(current, choice)}
        />
      )}

      {error === '' ? null : (
        <p role="alert" className="font-semibold text-today">
          {error}
        </p>
      )}

      {steps.length > 0 ? (
        <Button variant="ghost" icon={Undo2} disabled={busy} onClick={() => void back()}>
          {t.back}
        </Button>
      ) : null}
    </div>
  );
}

function CheckCard({
  item,
  step,
  total,
  today,
  busy,
  heading,
  cue,
  cuePhoto,
  onAnswer,
}: {
  item: InventoryItemView;
  step: number;
  total: number;
  today: LocalDate;
  busy: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  /** The spot to announce above the card: undefined for none, null for «Ohne festen Platz». */
  cue: InventoryItemView['spot'] | undefined;
  cuePhoto: string | undefined;
  onAnswer: (choice: CheckAnswer) => void;
}) {
  const image = useProductImage(item.gtin);
  const members = useMembers();
  const showOwner = item.owner !== 'shared' && (members?.length ?? 0) >= 2;
  const badge = expiryBadge(
    expiryStatus(item.expiresOn, today, item.expiryKind, soonThresholdFor(item.location)),
    item.expiresOn,
    today,
    item.location,
  );
  const canHalve = halfOf(item.quantity, item.unit) !== null;

  return (
    <section aria-labelledby="check-item" className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-ink-muted tabular-nums">
          {t.progress(step, total)}
        </p>
        <div
          aria-hidden="true"
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
        >
          <div
            className="h-full rounded-full bg-basil-600 transition-[width]"
            style={{ width: `${String(Math.round(((step - 1) / total) * 100))}%` }}
          />
        </div>
      </div>
      {cue === undefined ? null : (
        <p className="flex items-center gap-2 font-semibold">
          {cue === null ? (
            <MapPin aria-hidden="true" size={20} className="shrink-0 text-ink-muted" />
          ) : (
            <SpotThumb photo={cuePhoto} size={cuePhoto === undefined ? 24 : 40} />
          )}
          {cue === null ? t.noSpot : cue.name}
        </p>
      )}
      <Card className="flex items-center gap-4">
        {image === undefined ? (
          <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center text-5xl">
            {item.emoji ?? ''}
          </span>
        ) : (
          <img src={image} alt="" className="size-16 shrink-0 rounded-xl object-contain" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 id="check-item" ref={heading} tabIndex={-1} className="text-xl font-semibold">
              {item.name}
            </h2>
            {showOwner ? <OwnerMark ownerId={item.owner} /> : null}
          </div>
          <p className="text-ink-muted">{itemMeta(item)}</p>
          <div className="mt-2">
            <StatusChip tone={badge.tone}>{badge.label}</StatusChip>
          </div>
        </div>
      </Card>
      <p className="font-semibold">{t.question}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          disabled={busy}
          onClick={() => {
            onAnswer('still');
          }}
        >
          {t.still}
        </Button>
        <Button
          variant="secondary"
          disabled={busy || !canHalve}
          onClick={() => {
            onAnswer('half');
          }}
        >
          {t.half}
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            onAnswer('eaten');
          }}
        >
          {t.eaten}
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            onAnswer('wasted');
          }}
        >
          {t.wasted}
        </Button>
      </div>
      {shouldAskStillGood(item) && item.expiresOn <= today ? (
        <p className="text-sm text-ink-muted">{messages.rescue.stillGood}</p>
      ) : null}
    </section>
  );
}
