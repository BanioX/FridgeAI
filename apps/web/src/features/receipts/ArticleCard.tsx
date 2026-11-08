import {
  shelfLifeAt,
  StorageLocationSchema,
  type Category,
  type LocalDate,
  type ParsedReceiptLine,
  type Rappen,
  type StorageLocation,
} from '@fridgeai/core';
import { Check, ChevronDown, Circle } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { DateField } from '../../ui/DateField';
import { PriceField } from './PriceField';
import { ProductStep, type ReceiptMatching } from './ReceiptMatch';
import { doneCount, STEP_KEYS, type StepKey } from './receipt-steps';

const t = messages.receiptUpload.steps;

const PLACES = StorageLocationSchema.options.map((value) => ({
  value,
  label: messages.locations[value],
}));

/** Four small marks «Produkt · Datum · Ort · Preis», done or open, with the count for screen readers. */
function Marks({ done }: { done: Record<StepKey, boolean> }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-ink-muted">
      <span className="sr-only">{t.progress(doneCount(done))}: </span>
      {STEP_KEYS.map((key) => (
        <span
          key={key}
          className={`inline-flex items-center gap-1 ${done[key] ? 'text-basil-800' : ''}`}
        >
          {done[key] ? (
            <Check size={12} strokeWidth={3} aria-hidden="true" />
          ) : (
            <Circle size={12} aria-hidden="true" />
          )}
          {t.names[key]}
          <span className="sr-only">, {done[key] ? t.markDone : t.markOpen}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * One chosen food line as an «Artikel-Karte» with four steps (Alban, 7.11.2026): product, best
 * before, place and price. Collapsed it shows the checkbox, name, picture, price and the progress;
 * open it holds the steps and ends with «Weiter».
 */
export function ArticleCard({
  index,
  line,
  checked,
  withSteps,
  onCheck,
  open,
  onToggle,
  onNext,
  done,
  shownName,
  subline,
  priceText,
  priceHint,
  matching,
  asksProduct,
  today,
  category,
  estimate,
  date,
  onDate,
  place,
  onPlace,
  price,
  onPrice,
  amount,
}: {
  index: number;
  line: ParsedReceiptLine;
  checked: boolean;
  /** Ticked food: the four steps. Unticked and non-food lines stay a simple row. */
  withSteps: boolean;
  onCheck: () => void;
  open: boolean;
  onToggle: () => void;
  onNext: () => void;
  done: Record<StepKey, boolean>;
  shownName: string;
  subline: string;
  priceText: string;
  priceHint: ReactNode;
  matching: ReceiptMatching;
  asksProduct: boolean;
  today: LocalDate;
  category: Category;
  /** The category's estimate for the chosen place. */
  estimate: LocalDate;
  /** `undefined`: nothing entered yet, the estimate stands; `null`: the field was emptied. */
  date: LocalDate | null | undefined;
  onDate: (value: LocalDate | null) => void;
  place: StorageLocation;
  onPlace: (value: StorageLocation) => void;
  price: Rappen;
  onPrice: (value: Rappen) => void;
  amount: string;
}) {
  const id = useId();
  const panel = `${id}-steps`;
  const check = `${id}-check`;
  const row = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  // Opening another card scrolls it into view; the first render does not move the page.
  useEffect(() => {
    if (mounted.current && open && withSteps) {
      row.current?.scrollIntoView({ block: 'nearest' });
    }
    mounted.current = true;
  }, [open, withSteps]);

  const image = matching.matches.get(index)?.image;
  return (
    <>
      <div ref={row} className="flex items-center gap-1 pr-2">
        <label className="flex min-h-14 w-12 shrink-0 cursor-pointer items-center justify-center pl-3">
          <input
            id={check}
            type="checkbox"
            checked={checked}
            onChange={onCheck}
            aria-labelledby={`${id}-name ${id}-sub`}
            className="size-6 shrink-0 accent-basil-700"
          />
        </label>
        {withSteps ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panel}
            onClick={onToggle}
            className="block min-h-14 min-w-0 flex-1 rounded-lg py-2 pl-1 text-left hover:bg-surface-muted focus-visible:outline-2"
          >
            <span className="flex items-center gap-3">
              {image === undefined ? (
                <span className="size-10 shrink-0 rounded-lg bg-surface-muted" aria-hidden="true" />
              ) : (
                <img
                  src={image}
                  alt=""
                  className="size-10 shrink-0 rounded-lg bg-white object-contain"
                />
              )}
              <span className="min-w-0 flex-1 space-y-0.5">
                <span id={`${id}-name`} className="line-clamp-2 block font-semibold break-words">
                  {shownName}
                </span>
                <span id={`${id}-sub`} className="block truncate text-sm text-ink-muted">
                  {subline}
                </span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{priceText}</span>
              <ChevronDown
                size={18}
                aria-hidden="true"
                className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </span>
            <span className="block pt-1.5">
              <Marks done={done} />
            </span>
          </button>
        ) : (
          <>
            <label
              htmlFor={check}
              className="flex min-h-14 min-w-0 flex-1 cursor-pointer items-center py-2 pl-1"
            >
              <span className="min-w-0 flex-1">
                <span id={`${id}-name`} className="line-clamp-2 block font-semibold break-words">
                  {shownName}
                </span>
                <span id={`${id}-sub`} className="block truncate text-sm text-ink-muted">
                  {subline}
                </span>
                {priceHint}
              </span>
            </label>
            <PriceField name={line.name} value={price} onChange={onPrice} />
          </>
        )}
      </div>

      {withSteps && open ? (
        <div id={panel} className="space-y-5 px-4 pt-1 pb-4">
          <div className="space-y-2">
            <h3 className="font-semibold">{t.productTitle}</h3>
            <ProductStep matching={matching} index={index} name={line.name} asks={asksProduct} />
          </div>

          <DateField
            label={t.dateTitle}
            value={date === undefined ? estimate : date}
            onChange={onDate}
            today={today}
            location={place}
            typicalShelfLifeDays={shelfLifeAt(category, place)}
            estimated={date === undefined}
          />

          <ChoiceChips
            legend={t.placeTitle}
            options={PLACES}
            value={place}
            onChange={onPlace}
            segmented
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{t.priceTitle}</h3>
              <PriceField name={line.name} value={price} onChange={onPrice} />
            </div>
            <p className="text-sm text-ink-muted">{t.quantity(amount)}</p>
            {priceHint}
          </div>

          <Button fullWidth onClick={onNext}>
            {t.next}
          </Button>
        </div>
      ) : null}
    </>
  );
}
