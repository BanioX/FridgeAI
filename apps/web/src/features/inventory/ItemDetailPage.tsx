import {
  categoryById,
  expiryStatus,
  fallbackCategory,
  isFreezable,
  OutcomeSchema,
  portionChoices,
  portioningOf,
  ShareRecipientSchema,
  soonThresholdFor,
  WasteReasonSchema,
  type Id,
  type Outcome,
  type ShareRecipient,
  type WasteReason,
} from '@fridgeai/core';
import { ArrowLeft, PackageOpen, Pencil, Snowflake, Sun, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { StatusChip } from '../../ui/StatusChip';
import { describeDate } from '../../ui/date-text';
import { expiryBadge } from '../../ui/expiry-badge';
import { parseAmount } from './add-item';
import type { ClosedItem } from './closed-item';
import { FROM_DETAIL } from './edit-state';
import { itemMeta } from './item-meta';
import { formatQuantity } from '../../ui/quantity-text';
import { portionLabel } from './portion-labels';
import { ProductFacts } from './ProductFacts';
import { useInventoryItem } from './use-item';
import { useProductImage } from './use-product-image';

const t = messages.itemDetail;
const outcomeOptions = OutcomeSchema.options.map((value) => ({ value, label: t.outcomes[value] }));
const reasonOptions = WasteReasonSchema.options.map((value) => ({
  value,
  label: messages.wasteReasons[value],
}));
const recipientOptions = ShareRecipientSchema.options.map((value) => ({
  value,
  label: messages.shareRecipients[value],
}));

/**
 * One item (step 6): what happened to it – eaten, thrown away (with reason) or given away (with
 * recipient), all or in portions that fit the food – plus opening and freezing.
 */
export function ItemDetailPage() {
  const { itemId } = useParams();
  const { householdId, ids, inventory, today } = useAppData();
  const navigate = useNavigate();
  const item = useInventoryItem(itemId);
  const image = useProductImage(item?.gtin);
  const [outcome, setOutcome] = useState<Outcome>('eaten');
  const [portion, setPortion] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  const [reason, setReason] = useState<WasteReason | null>(null);
  const [recipient, setRecipient] = useState<ShareRecipient | null>(null);
  const [status, setStatus] = useState('');
  /** The partial outcome just saved: it can be undone until the next action. */
  const [undoable, setUndoable] = useState<Id | null>(null);
  const [busy, setBusy] = useState(false);

  if (item === undefined) {
    return <p className="sr-only">{messages.loading}</p>;
  }
  const back = (
    <Link
      to={`/inventory${item === null ? '' : `?location=${item.location}`}`}
      className="inline-flex min-h-12 items-center gap-2 font-semibold text-basil-700"
    >
      <ArrowLeft size={20} aria-hidden="true" />
      {t.back}
    </Link>
  );
  if (item === null) {
    return (
      <div className="space-y-4">
        {back}
        <p>{t.gone}</p>
      </div>
    );
  }

  const category = categoryById(item.categoryId) ?? fallbackCategory();
  const choices = portionChoices(item.quantity, item.unit, portioningOf(category).splits);
  const portionOptions = choices.map((choice, index) => ({
    value: String(index),
    label: portionLabel(choice, item.unit),
  }));
  const chosen = portion ?? String(choices.length - 1);
  const other = parseAmount(otherText);
  const otherInvalid = otherText.trim() !== '' && (other === null || other > item.quantity);
  const quantity =
    otherText.trim() === '' ? choices[Number(chosen)]?.quantity : otherInvalid ? undefined : other;
  const badge = expiryBadge(
    expiryStatus(item.expiresOn, today, item.expiryKind, soonThresholdFor(item.location)),
    item.expiresOn,
    today,
    item.location,
  );
  const canMove = item.location === 'freezer' || isFreezable(category);

  async function run(action: () => Promise<string | null>) {
    if (busy) {
      return;
    }
    setBusy(true);
    setStatus('');
    setUndoable(null);
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

  const record = () =>
    run(async () => {
      if (quantity === undefined || quantity === null) {
        return null;
      }
      const result = await inventory['inventory.recordOutcome']({
        commandId: ids.next(),
        householdId,
        itemId: item.id,
        outcome,
        quantity,
        ...(outcome === 'wasted' && reason !== null ? { wasteReason: reason } : {}),
        ...(outcome === 'shared_out' && recipient !== null ? { sharedWith: recipient } : {}),
      });
      if (result.remainingQuantity === 0) {
        const closed: ClosedItem = { eventId: result.eventId, name: item.name, outcome };
        void navigate(`/inventory?location=${item.location}`, { state: { closed } });
        return null;
      }
      setPortion(null);
      setOtherText('');
      setUndoable(result.eventId);
      return t.left(formatQuantity(result.remainingQuantity, item.unit));
    });

  const undo = (eventId: Id) =>
    run(async () => {
      const result = await inventory['inventory.undoOutcome']({
        commandId: ids.next(),
        householdId,
        eventId,
      });
      return t.undone(formatQuantity(result.quantity, item.unit));
    });

  const open = () =>
    run(async () => {
      const result = await inventory['inventory.open']({
        commandId: ids.next(),
        householdId,
        itemId: item.id,
      });
      return result.shortened ? t.opened(describeDate(result.expiresOn)) : t.openedSame;
    });

  const move = () =>
    run(async () => {
      const result = await inventory['inventory.move']({
        commandId: ids.next(),
        householdId,
        itemId: item.id,
        to: item.location === 'freezer' ? 'fridge' : 'freezer',
      });
      return t.moved(describeDate(result.expiresOn));
    });

  return (
    <div className="space-y-6 pb-8">
      {back}

      <div className="flex items-center gap-4">
        {image === undefined ? (
          <span aria-hidden="true" className="text-5xl leading-none">
            {item.emoji}
          </span>
        ) : (
          <img
            src={image}
            alt=""
            className="size-20 shrink-0 rounded-xl border border-line bg-surface object-contain"
          />
        )}
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{item.name}</h1>
          {item.brand === undefined && item.packSize === undefined ? null : (
            <p className="text-sm text-ink-muted">
              {[item.brand, item.packSize].filter((part) => part !== undefined).join(' · ')}
            </p>
          )}
          <p className="text-ink-muted">{itemMeta(item)}</p>
          {image === undefined ? null : (
            <a
              href="https://world.openfoodfacts.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-ink-muted underline underline-offset-2"
            >
              {messages.productFacts.imageCredit}
            </a>
          )}
        </div>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink-muted">
              {item.expiryKind === 'use_by' ? t.useBy : t.bestBefore}
            </p>
            <p className="font-semibold">
              {describeDate(item.expiresOn)}
              {item.expirySource === 'category_estimate' ? ` ${t.estimated}` : null}
            </p>
            {item.openedOn === undefined ? null : (
              <p className="mt-1 text-sm text-ink-muted">
                {t.openedOn(describeDate(item.openedOn))}
              </p>
            )}
          </div>
          <StatusChip tone={badge.tone}>{badge.label}</StatusChip>
        </div>
      </Card>

      <ProductFacts item={item} />

      <section aria-labelledby="outcome-title" className="space-y-5">
        <h2 id="outcome-title" className="font-display text-xl font-semibold">
          {t.whatHappened}
        </h2>
        <ChoiceChips
          legend={t.whatHappened}
          hideLegend
          segmented
          options={outcomeOptions}
          value={outcome}
          onChange={setOutcome}
        />
        <ChoiceChips
          legend={t.howMuch}
          options={portionOptions}
          value={otherText.trim() === '' ? chosen : null}
          onChange={(value) => {
            setPortion(value);
            setOtherText('');
          }}
        />
        <div className="space-y-1.5">
          <label htmlFor="other-amount" className="block text-sm font-semibold">
            {t.otherAmount(messages.units[item.unit])}
          </label>
          <input
            id="other-amount"
            value={otherText}
            onChange={(event) => {
              setOtherText(event.target.value);
            }}
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={otherInvalid}
            aria-describedby="other-amount-error"
            className={`min-h-12 w-40 rounded-xl border bg-surface px-4 text-lg tabular-nums outline-none focus:border-basil-600 ${
              otherInvalid ? 'border-today' : 'border-line'
            }`}
          />
          <p id="other-amount-error" className="text-sm text-today">
            {otherInvalid ? t.otherInvalid : null}
          </p>
        </div>
        {outcome === 'wasted' ? (
          <ChoiceChips legend={t.why} options={reasonOptions} value={reason} onChange={setReason} />
        ) : null}
        {outcome === 'shared_out' ? (
          <ChoiceChips
            legend={t.toWhom}
            options={recipientOptions}
            value={recipient}
            onChange={setRecipient}
          />
        ) : null}
        <Button
          fullWidth
          disabled={busy || quantity === undefined || quantity === null}
          onClick={() => {
            void record();
          }}
        >
          {t.confirm[outcome]}
        </Button>
      </section>

      <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1">
        <p role="status" className="font-semibold text-basil-800">
          {status}
        </p>
        {undoable === null ? null : (
          <Button
            variant="ghost"
            icon={Undo2}
            disabled={busy}
            onClick={() => {
              void undo(undoable);
            }}
          >
            {t.undo}
          </Button>
        )}
      </div>

      <section aria-labelledby="more-title" className="space-y-3">
        <h2 id="more-title" className="font-display text-xl font-semibold">
          {t.more}
        </h2>
        <Link
          to={`/inventory/${item.id}/edit`}
          state={FROM_DETAIL}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold text-ink transition-colors hover:bg-surface-muted"
        >
          <Pencil size={20} aria-hidden="true" />
          {messages.editItem.open}
        </Link>
        {item.openedOn === undefined ? (
          <Button
            variant="secondary"
            icon={PackageOpen}
            fullWidth
            disabled={busy}
            onClick={() => {
              void open();
            }}
          >
            {t.open}
          </Button>
        ) : null}
        {canMove ? (
          <Button
            variant="secondary"
            icon={item.location === 'freezer' ? Sun : Snowflake}
            fullWidth
            disabled={busy}
            onClick={() => {
              void move();
            }}
          >
            {item.location === 'freezer' ? t.thaw : t.freeze}
          </Button>
        ) : null}
      </section>
    </div>
  );
}
