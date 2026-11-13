import {
  displayQuantity,
  formatSwissDate,
  matchCategoryByName,
  rappen,
  sumRappen,
  type Id,
  type LocalDate,
  type ParsedReceipt,
  type ParsedReceiptLine,
  type Rappen,
  type Retailer,
  type StorageLocation,
} from '@fridgeai/core';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { messages } from '../../app/messages.de-CH';
import { useMoney } from '../../app/money';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { ShopBadge } from '../../ui/ShopBadge';
import { formatAmount } from '../inventory/add-item';
import { PriceField } from './PriceField';
import { priceHint, type PriceMemory } from './price-hint';
import { MatchPanel, MatchRow, useReceiptMatching, type ReceiptMatching } from './ReceiptMatch';

const t = messages.receiptUpload;

/** The order of the shop tabs: the big Swiss shops first, «Laden» for any other. */
const SHOPS: readonly Retailer[] = ['coop', 'migros', 'denner', 'aldi', 'lidl', 'other'];

/** What one line gets besides the default: a place and, when the person picked one, a date. */
export interface LineOverride {
  location?: StorageLocation;
  expiresOn?: LocalDate;
}

export interface Review {
  receipt: ParsedReceipt;
  hash: string;
  source: 'pdf' | 'photo';
  /** Fixed per receipt: a retry after an error never imports twice. */
  commandId: Id;
  chosen: ReadonlySet<number>;
  /** Earlier prices of the same products, by name on the receipt (ADR-0029). */
  memory: ReadonlyMap<string, PriceMemory>;
  /** Location and expiry chosen in «Einzeln durchgehen», by line; the list shows the same (ADR-0028). */
  overrides?: ReadonlyMap<number, LineOverride>;
}

export const paid = (line: ParsedReceiptLine) => rappen(line.priceRappen + line.discountRappen);

/** Food for the inventory: an article, not standard-rate VAT and not a non-food category (pet food). */
export const isFood = (line: ParsedReceiptLine) =>
  line.kind === 'item' &&
  line.isFood !== false &&
  matchCategoryByName(line.name)?.group !== 'non_food';

/**
 * Worth asking the open database: packed food. Loose produce and weighed goods rarely have one
 * barcode for everyone (ADR-0036).
 */
const isPacked = (line: ParsedReceiptLine) =>
  isFood(line) && line.unit !== 'g' && matchCategoryByName(line.name)?.group !== 'produce';

/** A corrected price replaces what was read: paid as typed, no discount left to explain it. */
export function withPrice(receipt: ParsedReceipt, index: number, price: Rappen): ParsedReceipt {
  const lines = receipt.lines.map((line, position) => {
    if (position !== index) {
      return line;
    }
    const perPiece = line.unit === 'pcs' && price % line.quantity === 0;
    const corrected: ParsedReceiptLine = {
      rawText: line.rawText,
      kind: line.kind,
      name: line.name,
      quantity: line.quantity,
      unit: line.unit,
      ...(line.isFood === undefined ? {} : { isFood: line.isFood }),
      priceRappen: price,
      discountRappen: rappen(0),
      ...(perPiece ? { unitPriceRappen: rappen(price / line.quantity) } : {}),
    };
    return corrected;
  });
  const computedTotalRappen = sumRappen(lines.map(paid));
  return {
    ...receipt,
    lines,
    computedTotalRappen,
    sumCheck:
      receipt.totalRappen === null
        ? 'no-total'
        : receipt.totalRappen === computedTotalRappen
          ? 'ok'
          : 'mismatch',
  };
}

export function amountText(line: ParsedReceiptLine): string {
  const shown = displayQuantity(line.quantity, line.unit);
  return `${formatAmount(shown.amount)} ${messages.inputUnits[shown.unit]}`;
}

interface ReceiptReviewProps {
  /** Unique on the page: element ids and the radio group derive from it. */
  id: string;
  review: Review;
  onChange: (review: Review) => void;
  /** Several receipts on the page: the section can fold and be left out. */
  collapsible: boolean;
  excluded: boolean;
  onExcludedChange: (excluded: boolean) => void;
  /** Shown right after the shop chooser and the sum line (the take button of a single receipt). */
  afterSum?: ReactNode;
  /** Hands the parent this receipt's matching, to read the accepted products on import. */
  onMatching: (matching: ReceiptMatching) => void;
}

/**
 * One receipt in the review (ADR-0028): heading, shop chooser, sum check and its lines. It owns its
 * Open Food Facts matching, so several receipts fit on one page (Alban, 8.11.2026).
 */
export function ReceiptReview({
  id,
  review,
  onChange,
  collapsible,
  excluded,
  onExcludedChange,
  afterSum,
  onMatching,
}: ReceiptReviewProps) {
  const { receipt } = review;
  const money = useMoney();
  const matching = useReceiptMatching();
  const needsLook = receipt.sumCheck !== 'ok';
  // Open when something needs a look; a receipt whose sum is right starts folded.
  const [open, setOpen] = useState(needsLook);

  // Alban, 7.11.2026: match with Open Food Facts right away (ADR-0036).
  useEffect(() => {
    void matching.start(
      review.receipt.lines.flatMap((line, index) =>
        review.chosen.has(index) && isPacked(line) ? [{ index, name: line.name }] : [],
      ),
    );
    // Once per receipt: later ticks change what is taken, not what is asked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    onMatching(matching);
  });

  const extras = sumRappen(receipt.lines.filter((line) => line.kind !== 'item').map(paid));
  // Shop and branch on the first line, the date small below: long branch names wrap calmly at
  // 390 px instead of pushing the date onto a line of its own. The hidden « · » keeps the
  // accessible name «Coop · Musterstadt Zentrum · 05.11.2026».
  const place = [t.retailers[receipt.retailer], receipt.storeName].filter(Boolean).join(' · ');
  const title = (
    <span className="min-w-0 flex-1">
      <span className="block break-words">{place}</span>
      {receipt.purchasedOn === undefined ? null : (
        <span className="block text-sm font-normal text-ink-muted">
          <span className="sr-only"> · </span>
          {formatSwissDate(receipt.purchasedOn)}
        </span>
      )}
    </span>
  );

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 id={`${id}-title`} className="min-w-0 flex-1 font-semibold">
          {collapsible ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`${id}-body`}
              aria-describedby={needsLook ? `${id}-mark` : undefined}
              onClick={() => {
                setOpen(!open);
              }}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg text-left"
            >
              <ShopBadge retailer={receipt.retailer} />
              {title}
              <ChevronDown
                size={20}
                aria-hidden="true"
                className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>
          ) : (
            <span className="flex items-center gap-2">
              <ShopBadge retailer={receipt.retailer} />
              {title}
            </span>
          )}
        </h2>
        {collapsible && needsLook ? (
          <span
            id={`${id}-mark`}
            className="shrink-0 rounded-full bg-today/10 px-2.5 py-1 text-xs font-semibold text-today"
          >
            {t.checkSum}
          </span>
        ) : null}
      </div>
      {collapsible ? (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={excluded}
            onChange={() => {
              onExcludedChange(!excluded);
            }}
            className="size-6 shrink-0 accent-basil-700"
          />
          {t.exclude}
        </label>
      ) : null}
      <div id={`${id}-body`} hidden={collapsible && !open} className="space-y-3">
        {/* min-w-0: a fieldset is as wide as its content otherwise; `relative` on each tab keeps its
            sr-only radio inside the scrolling row (else it widens the page, like #34). */}
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-semibold text-ink-muted">{t.shopQuestion}</legend>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {SHOPS.map((shop) => (
              <label
                key={shop}
                className={`relative flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-basil-600 ${
                  receipt.retailer === shop
                    ? 'border-basil-700 bg-basil-50 text-basil-800'
                    : 'border-line bg-surface text-ink'
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-shop`}
                  value={shop}
                  checked={receipt.retailer === shop}
                  onChange={() => {
                    onChange({ ...review, receipt: { ...receipt, retailer: shop } });
                  }}
                  className="sr-only"
                />
                <ShopBadge retailer={shop} size={30} />
                {t.retailers[shop]}
              </label>
            ))}
          </div>
        </fieldset>
        <p className={`text-sm ${receipt.sumCheck === 'ok' ? 'text-basil-800' : 'text-today'}`}>
          {receipt.totalRappen === null
            ? t.noTotal
            : receipt.sumCheck === 'ok'
              ? t.sumOk(money.format(receipt.totalRappen))
              : t.sumMismatch(
                  money.format(receipt.computedTotalRappen),
                  money.format(receipt.totalRappen),
                )}
        </p>
        {afterSum}
        <MatchPanel matching={matching} />
        <GroupedList>
          {receipt.lines.map((line, index) =>
            line.kind !== 'item' ? null : (
              <GroupedListItem key={`${String(index)}-${line.name}`} inset="check">
                <div className="flex items-center gap-2 pr-2">
                  <label className="flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-3 py-2 pl-4">
                    <input
                      type="checkbox"
                      checked={review.chosen.has(index)}
                      onChange={() => {
                        const chosen = new Set(review.chosen);
                        if (!chosen.delete(index)) {
                          chosen.add(index);
                        }
                        onChange({ ...review, chosen });
                      }}
                      className="size-6 shrink-0 accent-basil-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block font-semibold break-words">
                        {line.name}
                      </span>
                      <span className="block truncate text-sm text-ink-muted">
                        {[
                          amountText(line),
                          line.discountRappen < 0
                            ? t.instead(money.format(line.priceRappen, { currency: false }))
                            : undefined,
                          isFood(line) ? undefined : t.notFood,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      <PriceHint hint={priceHint(line, review.memory.get(line.name), money)} />
                    </span>
                  </label>
                  {/* The shop on every line (Alban, 8.11.2026); it changes with «Wo eingekauft?». */}
                  {receipt.retailer === 'other' ? null : (
                    <ShopBadge retailer={receipt.retailer} size={22} />
                  )}
                  <PriceField
                    name={line.name}
                    value={paid(line)}
                    onChange={(price) => {
                      onChange({ ...review, receipt: withPrice(receipt, index, price) });
                    }}
                  />
                </div>
                {review.chosen.has(index) ? (
                  <MatchRow matching={matching} index={index} name={line.name} />
                ) : null}
              </GroupedListItem>
            ),
          )}
        </GroupedList>
        {extras === 0 ? null : (
          <p className="text-sm text-ink-muted">{t.extras(money.format(extras))}</p>
        )}
      </div>
    </section>
  );
}

const TONES = { dearer: 'text-today', cheaper: 'text-basil-800', info: 'text-ink-muted' } as const;

function PriceHint({ hint }: { hint: ReturnType<typeof priceHint> }) {
  return hint === null ? null : (
    <span className={`block text-sm font-medium ${TONES[hint.tone]}`}>{hint.text}</span>
  );
}
