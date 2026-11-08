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
  type ParsedReceipt,
  type ParsedReceiptLine,
  type Rappen,
  type Retailer,
} from '@fridgeai/core';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { ShopBadge } from '../../ui/ShopBadge';
import { formatAmount } from '../inventory/add-item';
import { MatchPanel, MatchRow, useReceiptMatching } from './ReceiptMatch';
import { useMoney } from '../../app/money';
import { PriceField } from './PriceField';
import { priceHint, type PriceMemory } from './price-hint';
import { sha256Hex } from './hash';
import { readImageText } from './read-image';
import { readPdfText } from './read-pdf';

const t = messages.receiptUpload;
const MAX_BYTES = 15 * 1024 * 1024;

const isPdf = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

/** The order of the shop tabs: the big Swiss shops first, «Laden» for any other. */
const SHOPS: readonly Retailer[] = ['coop', 'migros', 'denner', 'aldi', 'lidl', 'other'];

interface Review {
  receipt: ParsedReceipt;
  hash: string;
  source: 'pdf' | 'photo';
  /** Fixed per receipt: a retry after an error never imports twice. */
  commandId: Id;
  chosen: ReadonlySet<number>;
  /** Earlier prices of the same products, by name on the receipt (ADR-0029). */
  memory: ReadonlyMap<string, PriceMemory>;
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
 * «Quittung hochladen» (ADR-0028): a receipt PDF, photo or screenshot is read on the device, the lines show with name and
 * price paid, food is ticked, and «übernehmen» stores the receipt and puts the ticked items into
 * the inventory with their price. Several files at once (Alban, 8.11.2026) come one after the
 * other, each with its own review; «übernehmen» or «überspringen» leads to the next.
 */
export function ReceiptUpload() {
  const { householdId, ids, inventory } = useAppData();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  /** Files still waiting after the one on screen, and where the person is among all of them. */
  const [queue, setQueue] = useState<readonly File[]>([]);
  const [position, setPosition] = useState<{ index: number; total: number } | null>(null);
  const matching = useReceiptMatching();

  function start(files: readonly File[]) {
    const [first, ...rest] = files;
    if (first === undefined) {
      return;
    }
    setQueue(rest);
    setPosition(files.length > 1 ? { index: 1, total: files.length } : null);
    void read(first);
  }

  /** The next file, or the inventory when none is left. */
  function next() {
    const [file, ...rest] = queue;
    if (file === undefined) {
      void navigate('/inventory');
      return;
    }
    setQueue(rest);
    setPosition((current) => (current === null ? null : { ...current, index: current.index + 1 }));
    void read(file);
  }
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
      setReview({
        receipt,
        hash: await sha256Hex(text),
        source,
        commandId: ids.next(),
        chosen,
        memory: new Map(products.map((product) => [product.name, product])),
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
            ...(current.chosen.has(index)
              ? { location: (matchCategoryByName(line.name) ?? fallbackCategory()).defaultLocation }
              : {}),
            ...(found === undefined ? {} : { gtin: found.gtin, productName: found.name }),
          };
        }),
      });
      if (result.duplicate) {
        setStatus(t.duplicate);
        return;
      }
      next();
    } catch {
      setStatus(t.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  const receipt = review?.receipt;
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
          multiple
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            event.target.value = '';
            start(files);
          }}
        />
      </label>
      {position === null ? null : (
        <p className="mt-3 text-sm font-semibold text-ink-muted">
          {t.progress(position.index, position.total)}
        </p>
      )}
      <p role="status" className="mt-2 text-sm font-semibold text-basil-800">
        {status}
      </p>
      {review === null && !busy && queue.length > 0 ? (
        <Button fullWidth variant="secondary" onClick={next}>
          {t.next}
        </Button>
      ) : null}
      {review === null ? <p className="text-xs text-ink-muted">{t.trademarks}</p> : null}

      {review === null || receipt === undefined ? null : (
        <section aria-labelledby="receipt-title" className="mt-4 space-y-3">
          <h2 id="receipt-title" className="flex items-center gap-2 font-semibold">
            <ShopBadge retailer={receipt.retailer} />
            {[
              t.retailers[receipt.retailer],
              receipt.storeName,
              receipt.purchasedOn === undefined ? undefined : formatSwissDate(receipt.purchasedOn),
            ]
              .filter(Boolean)
              .join(' · ')}
          </h2>
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
                    name="shop"
                    value={shop}
                    checked={receipt.retailer === shop}
                    onChange={() => {
                      setReview({ ...review, receipt: { ...receipt, retailer: shop } });
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
                          setReview({ ...review, chosen });
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
                    <PriceField
                      name={line.name}
                      value={paid(line)}
                      onChange={(price) => {
                        setReview({ ...review, receipt: withPrice(receipt, index, price) });
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
          {queue.length > 0 ? (
            <Button fullWidth variant="ghost" disabled={busy} onClick={next}>
              {t.skip}
            </Button>
          ) : null}
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
