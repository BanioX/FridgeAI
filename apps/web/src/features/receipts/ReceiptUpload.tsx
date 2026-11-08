import {
  displayQuantity,
  fallbackCategory,
  formatSwissDate,
  IsoDateTimeSchema,
  matchCategoryByName,
  parseReceiptText,
  rappen,
  sumRappen,
  type Id,
  type LocalDate,
  type ParsedReceipt,
  type ParsedReceiptLine,
  type Rappen,
  type StorageLocation,
} from '@fridgeai/core';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { formatAmount, suggestedExpiry } from '../inventory/add-item';
import { ArticleCard } from './ArticleCard';
import { MatchPanel, useReceiptMatching } from './ReceiptMatch';
import { useMoney } from '../../app/money';
import { priceHint, type PriceMemory } from './price-hint';
import { sha256Hex } from './hash';
import { readImageText } from './read-image';
import { readPdfText } from './read-pdf';
import { isComplete, nextIncomplete, stepsDone } from './receipt-steps';

const t = messages.receiptUpload;
const MAX_BYTES = 15 * 1024 * 1024;

const isPdf = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

interface Review {
  receipt: ParsedReceipt;
  hash: string;
  source: 'pdf' | 'photo';
  /** Fixed per receipt: a retry after an error never imports twice. */
  commandId: Id;
  chosen: ReadonlySet<number>;
  /** Earlier prices of the same products, by name on the receipt (ADR-0029). */
  memory: ReadonlyMap<string, PriceMemory>;
  /** Best-before dates the person entered per line; `null`: the field was emptied again. */
  dates: ReadonlyMap<number, LocalDate | null>;
  /** Places the person chose per line; without one the category's default place stands. */
  places: ReadonlyMap<number, StorageLocation>;
  /** The article card that is open (one at a time). */
  open: number | null;
}

const paid = (line: ParsedReceiptLine) => rappen(line.priceRappen + line.discountRappen);

/** Food for the inventory: an article, not standard-rate VAT and not a non-food category (pet food). */
const isFood = (line: ParsedReceiptLine) =>
  line.kind === 'item' &&
  line.isFood !== false &&
  matchCategoryByName(line.name)?.group !== 'non_food';

/** A corrected price replaces what was read: paid as typed, no discount left to explain it. */
function withPrice(receipt: ParsedReceipt, index: number, price: Rappen): ParsedReceipt {
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

function amountText(line: ParsedReceiptLine): string {
  const shown = displayQuantity(line.quantity, line.unit);
  return `${formatAmount(shown.amount)} ${messages.inputUnits[shown.unit]}`;
}

/**
 * Worth asking the open database: packed food. Loose produce and weighed goods rarely have one
 * barcode for everyone (ADR-0036).
 */
const isPacked = (line: ParsedReceiptLine) =>
  isFood(line) && line.unit !== 'g' && matchCategoryByName(line.name)?.group !== 'produce';

const placeOf = (review: Review, index: number, line: ParsedReceiptLine): StorageLocation =>
  review.places.get(index) ?? categoryOf(line).defaultLocation;

const categoryOf = (line: ParsedReceiptLine) =>
  matchCategoryByName(line.name) ?? fallbackCategory();

/** Food that gets an article card: ticked packed or loose food. */
const hasSteps = (review: Review, index: number, line: ParsedReceiptLine) =>
  review.chosen.has(index) && isFood(line);

/** Purchase time as printed (local time of the device), else now. */
function purchasedAt(receipt: ParsedReceipt) {
  const printed =
    receipt.purchasedOn === undefined
      ? new Date()
      : new Date(`${receipt.purchasedOn}T${receipt.purchasedTime ?? '12:00'}:00`);
  return IsoDateTimeSchema.parse(
    (Number.isNaN(printed.getTime()) ? new Date() : printed).toISOString(),
  );
}

/**
 * «Bon hochladen» (ADR-0028): a receipt PDF, photo or screenshot is read on the device, the lines show with name and
 * price paid, food is ticked, and «übernehmen» stores the receipt and puts the ticked items into
 * the inventory with their price.
 */
export function ReceiptUpload() {
  const { householdId, ids, inventory, today } = useAppData();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const matching = useReceiptMatching();
  const money = useMoney();

  async function read(file: File) {
    setReview(null);
    matching.reset();
    if (file.size > MAX_BYTES) {
      setStatus(t.tooLarge);
      return;
    }
    const source = isPdf(file) ? 'pdf' : 'photo';
    setBusy(true);
    setStatus(source === 'pdf' ? t.reading : t.readingPhoto);
    try {
      const text =
        source === 'pdf' ? await readPdfText(await file.arrayBuffer()) : await readImageText(file);
      const receipt = parseReceiptText(text);
      if (text.trim() === '' || !receipt.lines.some((line) => line.kind === 'item')) {
        setStatus(text.trim() === '' && source === 'pdf' ? t.noText : t.noLines);
        return;
      }
      const chosen = new Set(receipt.lines.flatMap((line, index) => (isFood(line) ? [index] : [])));
      const names = [
        ...new Set(
          receipt.lines.flatMap((line) =>
            line.kind === 'item' && line.name.trim() !== '' ? [line.name.slice(0, 120)] : [],
          ),
        ),
      ].slice(0, 100);
      const { products } =
        names.length === 0
          ? { products: [] }
          : await inventory['prices.memory']({ householdId, names }).catch(() => ({
              products: [],
            }));
      const first = receipt.lines.findIndex((line, index) => chosen.has(index) && isFood(line));
      setReview({
        receipt,
        hash: await sha256Hex(text),
        source,
        commandId: ids.next(),
        chosen,
        memory: new Map(products.map((product) => [product.name, product])),
        dates: new Map(),
        places: new Map(),
        // The first card to work on opens by itself.
        open: first < 0 ? null : first,
      });
      setStatus('');
      // Alban, 7.11.2026: match with Open Food Facts right away (ADR-0036).
      void matching.start(
        receipt.lines.flatMap((line, index) =>
          chosen.has(index) && isPacked(line) ? [{ index, name: line.name }] : [],
        ),
      );
    } catch {
      setStatus(t.failed);
    } finally {
      setBusy(false);
    }
  }

  async function take(current: Review) {
    setBusy(true);
    setStatus('');
    const { receipt } = current;
    try {
      const result = await inventory['receipts.import']({
        commandId: current.commandId,
        householdId,
        retailer: receipt.retailer,
        ...(receipt.storeName === undefined ? {} : { storeName: receipt.storeName }),
        purchasedAt: purchasedAt(receipt),
        totalRappen: receipt.totalRappen ?? receipt.computedTotalRappen,
        source: current.source,
        hash: current.hash,
        lines: receipt.lines.map((line, index) => {
          const found = current.chosen.has(index) ? matching.accepted(index) : undefined;
          const picked = current.dates.get(index);
          return {
            name: (line.name.trim() === '' ? t.fallbackNames[line.kind] : line.name).slice(0, 120),
            kind: line.kind,
            quantity: line.quantity,
            unit: line.unit,
            ...(line.unitPriceRappen === undefined
              ? {}
              : { unitPriceRappen: line.unitPriceRappen }),
            priceRappen: line.priceRappen,
            discountRappen: line.discountRappen,
            isFood: isFood(line),
            ...(current.chosen.has(index) ? { location: placeOf(current, index, line) } : {}),
            ...(current.chosen.has(index) && picked !== null && picked !== undefined
              ? { expiresOn: picked }
              : {}),
            ...(found === undefined ? {} : { gtin: found.gtin, productName: found.name }),
          };
        }),
      });
      if (result.duplicate) {
        setStatus(t.duplicate);
        return;
      }
      void navigate('/inventory');
    } catch {
      setStatus(t.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  const receipt = review?.receipt;
  const doneOf = (index: number) => {
    const line = receipt?.lines[index];
    return stepsDone({
      asksProduct: line !== undefined && isPacked(line),
      productConfirmed: matching.accepted(index) !== undefined,
      datePicked: (review?.dates.get(index) ?? null) !== null,
    });
  };
  /** Ticked food lines, in list order: the articles with four steps. */
  const cards =
    review === null || receipt === undefined
      ? []
      : receipt.lines.flatMap((line, index) => (hasSteps(review, index, line) ? [index] : []));
  const completeCount = cards.filter((index) => isComplete(doneOf(index))).length;
  const extras =
    receipt === undefined
      ? null
      : sumRappen(receipt.lines.filter((line) => line.kind !== 'item').map(paid));

  return (
    <Card>
      <p className="text-ink-muted">{t.intro}</p>
      <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-basil-700 px-5 font-semibold text-white transition-colors hover:bg-basil-800 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-basil-600">
        <FileText size={20} aria-hidden="true" />
        {t.choose}
        <input
          type="file"
          accept="application/pdf,.pdf,image/*"
          disabled={busy}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file !== undefined) {
              void read(file);
            }
          }}
        />
      </label>
      <p role="status" className="mt-2 text-sm font-semibold text-basil-800">
        {status}
      </p>

      {review === null || receipt === undefined ? null : (
        <section aria-labelledby="receipt-title" className="mt-4 space-y-3">
          <h2 id="receipt-title" className="font-semibold">
            {[
              t.retailers[receipt.retailer],
              receipt.storeName,
              receipt.purchasedOn === undefined ? undefined : formatSwissDate(receipt.purchasedOn),
            ]
              .filter(Boolean)
              .join(' · ')}
          </h2>
          <p className={`text-sm ${receipt.sumCheck === 'ok' ? 'text-basil-800' : 'text-today'}`}>
            {receipt.sumCheck === 'ok' || receipt.totalRappen === null
              ? receipt.totalRappen === null
                ? t.noTotal
                : t.sumOk(money.format(receipt.totalRappen))
              : t.sumMismatch(
                  money.format(receipt.computedTotalRappen),
                  money.format(receipt.totalRappen),
                )}
          </p>
          <MatchPanel matching={matching} />
          {cards.length === 0 ? null : (
            <div className="space-y-1.5">
              <p id="receipt-complete" className="text-sm font-semibold">
                {t.steps.overall(completeCount, cards.length)}
              </p>
              <div
                role="progressbar"
                aria-labelledby="receipt-complete"
                aria-valuemin={0}
                aria-valuemax={cards.length}
                aria-valuenow={completeCount}
                className="h-1.5 overflow-hidden rounded-full bg-surface-muted"
              >
                <div
                  className="h-full rounded-full bg-basil-700 transition-[width]"
                  style={{ width: `${String((completeCount / cards.length) * 100)}%` }}
                />
              </div>
            </div>
          )}
          <GroupedList>
            {receipt.lines.map((line, index) => {
              if (line.kind !== 'item') {
                return null;
              }
              const withSteps = hasSteps(review, index, line);
              const place = placeOf(review, index, line);
              const date = review.dates.get(index);
              const accepted = withSteps ? matching.accepted(index) : undefined;
              return (
                <GroupedListItem key={`${String(index)}-${line.name}`} inset="check">
                  <ArticleCard
                    index={index}
                    line={line}
                    checked={review.chosen.has(index)}
                    withSteps={withSteps}
                    onCheck={() => {
                      const chosen = new Set(review.chosen);
                      if (!chosen.delete(index)) {
                        chosen.add(index);
                      }
                      setReview({
                        ...review,
                        chosen,
                        open: review.open === index ? null : review.open,
                      });
                    }}
                    open={review.open === index}
                    onToggle={() => {
                      setReview({ ...review, open: review.open === index ? null : index });
                    }}
                    onNext={() => {
                      setReview({
                        ...review,
                        open: nextIncomplete(cards, index, (other) => isComplete(doneOf(other))),
                      });
                    }}
                    done={doneOf(index)}
                    shownName={accepted?.name ?? line.name}
                    subline={[
                      amountText(line),
                      line.discountRappen < 0
                        ? t.instead(money.format(line.priceRappen, { currency: false }))
                        : undefined,
                      isFood(line) ? undefined : t.notFood,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    priceText={money.format(paid(line), { currency: false })}
                    priceHint={
                      <PriceHint hint={priceHint(line, review.memory.get(line.name), money)} />
                    }
                    matching={matching}
                    asksProduct={isPacked(line)}
                    today={today}
                    category={categoryOf(line)}
                    estimate={suggestedExpiry(categoryOf(line), place, today)}
                    date={date}
                    onDate={(value) => {
                      setReview({ ...review, dates: new Map(review.dates).set(index, value) });
                    }}
                    place={place}
                    onPlace={(value) => {
                      setReview({ ...review, places: new Map(review.places).set(index, value) });
                    }}
                    price={paid(line)}
                    onPrice={(value) => {
                      setReview({ ...review, receipt: withPrice(receipt, index, value) });
                    }}
                    amount={amountText(line)}
                  />
                </GroupedListItem>
              );
            })}
          </GroupedList>
          {extras === null || extras === 0 ? null : (
            <p className="text-sm text-ink-muted">{t.extras(money.format(extras))}</p>
          )}
          <Button
            fullWidth
            disabled={busy || review.chosen.size === 0}
            onClick={() => {
              void take(review);
            }}
          >
            {t.take(review.chosen.size)}
          </Button>
        </section>
      )}
    </Card>
  );
}

const TONES = { dearer: 'text-today', cheaper: 'text-basil-800', info: 'text-ink-muted' } as const;

function PriceHint({ hint }: { hint: ReturnType<typeof priceHint> }) {
  return hint === null ? null : (
    <span className={`block text-sm font-medium ${TONES[hint.tone]}`}>{hint.text}</span>
  );
}
