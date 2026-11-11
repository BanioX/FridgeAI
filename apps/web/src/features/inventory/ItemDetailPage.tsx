import {
  canBeRescued,
  categoryById,
  perishabilityOf,
  shelfScore,
  expiryStatus,
  fallbackCategory,
  itemBadges,
  portionChoices,
  portioningOf,
  shouldAskStillGood,
  shouldSuggestFreezing,
  soonThresholdFor,
  WasteReasonSchema,
  type Id,
  type LocalDate,
  type Outcome,
  type WasteReason,
} from '@fridgeai/core';
import { ArrowLeft, PackageOpen, Pencil, Snowflake, Sun, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { PriceMemoryNote } from '../receipts/PriceMemoryNote';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { ItemBadges } from '../../ui/ItemBadges';
import { ShopBadge } from '../../ui/ShopBadge';
import { ScoreRing } from '../../ui/ScoreRing';
import { StatusChip } from '../../ui/StatusChip';
import { describeDate } from '../../ui/date-text';
import { expiryBadge } from '../../ui/expiry-badge';
import { parseAmount } from './add-item';
import type { ClosedItem } from './closed-item';
import { FROM_DETAIL } from './edit-state';
import { useFreezeHint } from './FreezeHint';
import { itemMeta } from './item-meta';
import { formatQuantity } from '../../ui/quantity-text';
import { portionLabel } from './portion-labels';
import { OtherPacks } from './OtherPacks';
import { ProductFacts } from './ProductFacts';
import { useInventoryItem } from './use-item';
import { useProductImage } from './use-product-image';

const t = messages.itemDetail;
/** «Weitergegeben» is gone from the choice (Alban, 8.11.2026); old entries count as «Verwertet». */
const outcomeOptions = (['eaten', 'wasted'] as const).map((value) => ({
  value,
  label: t.outcomes[value],
}));
const rescueOptions = [
  { value: 'yes' as const, label: messages.itemDetail.rescueYes },
  { value: 'no' as const, label: messages.itemDetail.rescueNo },
];
const reasonOptions = WasteReasonSchema.options.map((value) => ({
  value,
  label: messages.wasteReasons[value],
}));

/**
 * One item (step 6): what happened to it – «Verwertet» or «Entsorgt» (with reason), all or in
 * portions that fit the food – plus opening and freezing.
 */
export function ItemDetailPage() {
  const { itemId } = useParams();
  // A fresh page per item: choices and undo never carry over to another pack.
  return <ItemDetail key={itemId} itemId={itemId} />;
}

function ItemDetail({ itemId }: { itemId: string | undefined }) {
  const { householdId, ids, inventory, today } = useAppData();
  const navigate = useNavigate();
  const item = useInventoryItem(itemId);
  const image = useProductImage(item?.gtin);
  const [outcome, setOutcome] = useState<Outcome>('eaten');
  const [portion, setPortion] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  const [reason, setReason] = useState<WasteReason | null>(null);
  /** «Ohne Rettich im Abfall gelandet?» (ADR-0039): only a «Ja» counts as rescued. */
  const [rescued, setRescued] = useState<'yes' | 'no'>('no');
  const [status, setStatus] = useState('');
  /** The partial outcome just saved: it can be undone until the next action. */
  const [undoable, setUndoable] = useState<Id | null>(null);
  /** Set after the one-tap freeze: the date it had in the fridge, for «Rückgängig». */
  const [frozenFrom, setFrozenFrom] = useState<LocalDate | null>(null);
  const [busy, setBusy] = useState(false);
  const freezeHint = useFreezeHint();

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
  // Any food can be put in the freezer; what does not freeze well asks first (R2-1).
  const canMove = item.location === 'freezer' || category.isFood;
  // Haltbarkeit 1 to 10 (ADR-0038): an open pack scores by its days after opening.
  const score = shelfScore(category, { opened: item.openedOn !== undefined });
  const level = perishabilityOf(score);
  // «Gerettet» only when it really was on the brink, never for thrown away food (ADR-0039).
  const rescuable = outcome !== 'wasted' && canBeRescued(item, today);

  async function run(action: () => Promise<string | null>) {
    if (busy) {
      return;
    }
    setBusy(true);
    setStatus('');
    setUndoable(null);
    setFrozenFrom(null);
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
        ...(rescuable && rescued === 'yes' ? { rescued: true } : {}),
      });
      if (result.remainingQuantity === 0) {
        const closed: ClosedItem = {
          kind: 'outcome',
          eventId: result.eventId,
          name: item.name,
          outcome,
          ...(result.rescued
            ? {
                rescuedRappen: result.valueRappen,
                ...(result.valueEstimated ? { estimated: true as const } : {}),
              }
            : {}),
        };
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
      const to = item.location === 'freezer' ? 'fridge' : 'freezer';
      const plan = to === 'freezer' ? await freezeHint.ask([item]) : { move: [item], force: false };
      if (plan.move.length === 0) {
        return null;
      }
      const result = await inventory['inventory.move']({
        commandId: ids.next(),
        householdId,
        itemId: item.id,
        to,
        ...(plan.force ? { allowUnsuitable: true } : {}),
      });
      return t.moved(describeDate(result.expiresOn));
    });

  // K4: freeze with one tap; «Rückgängig» goes back to the fridge with the old date.
  const freezeNow = () =>
    run(async () => {
      const result = await inventory['inventory.move']({
        commandId: ids.next(),
        householdId,
        itemId: item.id,
        to: 'freezer',
      });
      setFrozenFrom(item.expiresOn);
      return messages.rescue.frozen(item.name, describeDate(result.expiresOn));
    });

  const unfreeze = (previous: LocalDate) =>
    run(async () => {
      await inventory['inventory.updateItem']({
        commandId: ids.next(),
        householdId,
        itemId: item.id,
        location: 'fridge',
        expiresOn: previous,
      });
      return messages.rescue.unfrozen(item.name);
    });

  // Entered by mistake or for a test: gone at once, «Rückgängig» waits in the list.
  const remove = () =>
    run(async () => {
      await inventory['inventory.deleteItem']({
        commandId: ids.next(),
        householdId,
        itemId: item.id,
      });
      const closed: ClosedItem = { kind: 'deleted', itemId: item.id, name: item.name };
      void navigate(`/inventory?location=${item.location}`, { state: { closed } });
      return null;
    });

  return (
    <div className="space-y-6 pb-8">
      {freezeHint.sheet}
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
          <h1 className="large-title">{item.name}</h1>
          {item.brand === undefined && item.packSize === undefined ? null : (
            <p className="text-sm text-ink-muted">
              {[item.brand, item.packSize].filter((part) => part !== undefined).join(' · ')}
            </p>
          )}
          <p className="text-ink-muted">{itemMeta(item)}</p>
          <div className="mt-1.5 empty:hidden">
            <ItemBadges badges={itemBadges(item, today)} />
          </div>
          {item.retailer === undefined ? null : (
            <p className="mt-0.5 flex items-center gap-2 text-ink-muted">
              <ShopBadge retailer={item.retailer} size={20} />
              {t.boughtAt(messages.receiptUpload.retailers[item.retailer])}
            </p>
          )}
          <PriceMemoryNote name={item.name} />
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
        <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
          <ScoreRing
            score={score}
            level={level}
            label={t.scoreLabel(score, t.perishability[level])}
          />
          <div>
            <p className="font-semibold">
              {t.score(score)} · {t.perishability[level]}
            </p>
            {item.openedOn === undefined && category.afterOpeningDays !== undefined ? (
              <p className="text-sm text-ink-muted">{t.keepsOpen(category.afterOpeningDays)}</p>
            ) : null}
          </div>
        </div>
      </Card>

      {shouldSuggestFreezing(item, today) ? (
        <Card variant="tip" className="flex items-center justify-between gap-3">
          <p className="min-w-0 font-semibold">{t.freezeTip}</p>
          <Button
            icon={Snowflake}
            disabled={busy}
            onClick={() => {
              void freezeNow();
            }}
          >
            {messages.rescue.freeze}
          </Button>
        </Card>
      ) : null}

      <OtherPacks item={item} />

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
        {outcome === 'wasted' && shouldAskStillGood(item) ? (
          <Card variant="tip">{messages.rescue.stillGood}</Card>
        ) : null}
        {outcome === 'wasted' ? (
          <ChoiceChips legend={t.why} options={reasonOptions} value={reason} onChange={setReason} />
        ) : null}
        {rescuable ? (
          <ChoiceChips
            legend={t.rescueQuestion}
            options={rescueOptions}
            value={rescued}
            onChange={setRescued}
            segmented
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
        {frozenFrom === null ? null : (
          <Button
            variant="ghost"
            icon={Undo2}
            disabled={busy}
            onClick={() => {
              void unfreeze(frozenFrom);
            }}
          >
            {t.undo}
          </Button>
        )}
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
        <Button
          variant="ghost"
          icon={Trash2}
          fullWidth
          disabled={busy}
          className="text-danger hover:bg-today-bg"
          onClick={() => {
            void remove();
          }}
        >
          {messages.editItem.delete}
        </Button>
      </section>
    </div>
  );
}
