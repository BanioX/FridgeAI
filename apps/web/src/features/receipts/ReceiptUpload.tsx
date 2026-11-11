import {
  fallbackCategory,
  IsoDateTimeSchema,
  matchCategoryByName,
  parseReceiptText,
  type ParsedReceipt,
} from '@fridgeai/core';
import { FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { sha256Hex } from './hash';
import { readImageText } from './read-image';
import { readPdfText } from './read-pdf';
import { batchTotals, orderBySumCheck, seenInBatch } from './receipt-batch';
import type { ReceiptMatching } from './ReceiptMatch';
import { isFood, ReceiptReview, type Review } from './ReceiptReview';

const t = messages.receiptUpload;
const MAX_BYTES = 15 * 1024 * 1024;

const isPdf = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

/** One receipt on the review page. */
interface Section {
  key: string;
  review: Review;
  /** «Diese Quittung nicht übernehmen». */
  excluded: boolean;
  fileName: string;
}

/** A file that is not on the page, with the reason. */
interface LeftOut {
  fileName: string;
  text: string;
}

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
 * the inventory with their price. Several files at once (Alban, 8.11.2026) are read first, one
 * after the other, and then shown on one page, one section per receipt, with one button for all.
 */
export function ReceiptUpload() {
  const { householdId, ids, inventory } = useAppData();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [sections, setSections] = useState<readonly Section[]>([]);
  const [leftOut, setLeftOut] = useState<readonly LeftOut[]>([]);
  /** The matching of each receipt, read when its products are taken over. */
  const matchings = useRef(new Map<string, ReceiptMatching>());

  /** One file: its review, or the reason it cannot be shown. */
  async function read(file: File): Promise<{ review: Review } | { text: string }> {
    if (file.size > MAX_BYTES) {
      return { text: t.tooLarge };
    }
    const source = isPdf(file) ? 'pdf' : 'photo';
    try {
      const text =
        source === 'pdf' ? await readPdfText(await file.arrayBuffer()) : await readImageText(file);
      const receipt = parseReceiptText(text);
      if (text.trim() === '' || !receipt.lines.some((line) => line.kind === 'item')) {
        return { text: text.trim() === '' && source === 'pdf' ? t.noText : t.noLines };
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
      return {
        review: {
          receipt,
          hash: await sha256Hex(text),
          source,
          commandId: ids.next(),
          chosen,
          memory: new Map(products.map((product) => [product.name, product])),
        },
      };
    } catch {
      return { text: t.failed };
    }
  }

  /** The hashes of receipts this household already has; on an error none (the import checks). */
  async function alreadyImported(hashes: readonly string[]): Promise<ReadonlySet<string>> {
    if (hashes.length === 0) {
      return new Set();
    }
    try {
      const { known } = await inventory['receipts.known']({
        householdId,
        hashes: hashes.slice(0, 50),
      });
      return new Set(known);
    } catch {
      return new Set();
    }
  }

  /** Reads all files first, one after the other; then one page shows them all. */
  async function start(files: readonly File[]) {
    if (files.length === 0) {
      return;
    }
    const several = files.length > 1;
    setSections([]);
    setLeftOut([]);
    setBusy(true);
    const named: { fileName: string; review: Review }[] = [];
    const skipped: LeftOut[] = [];
    for (const [position, file] of files.entries()) {
      setStatus(
        several
          ? t.readingOf(position + 1, files.length)
          : isPdf(file)
            ? t.reading
            : t.readingPhoto,
      );
      const result = await read(file);
      if (!('review' in result)) {
        skipped.push({ fileName: file.name, text: result.text });
      } else if (
        seenInBatch(
          result.review.hash,
          named.map((entry) => entry.review),
        )
      ) {
        skipped.push({ fileName: file.name, text: t.alreadyKnown });
      } else {
        named.push({ fileName: file.name, review: result.review });
      }
    }
    // Receipts already taken over are named before the review, not after «übernehmen».
    const known = await alreadyImported(named.map((entry) => entry.review.hash));
    for (const entry of named) {
      if (known.has(entry.review.hash)) {
        skipped.push({ fileName: entry.fileName, text: t.alreadyKnown });
      }
    }
    const fresh = named.filter((entry) => !known.has(entry.review.hash));
    matchings.current.clear();
    setSections(
      orderBySumCheck(fresh).map(({ fileName, review }, position) => ({
        key: `receipt-${String(position)}`,
        review,
        excluded: false,
        fileName,
      })),
    );
    if (several) {
      setLeftOut(skipped);
      setStatus('');
    } else {
      const reason = skipped[0]?.text ?? '';
      setStatus(reason === t.alreadyKnown ? t.duplicate(1) : reason);
    }
    setBusy(false);
  }

  /** Stores each included receipt with its ticked lines; one summary, then the inventory. */
  async function takeAll() {
    setBusy(true);
    setStatus('');
    const taken = sections.filter((section) => !section.excluded && section.review.chosen.size > 0);
    const done = new Set<string>();
    const known: LeftOut[] = [];
    let articles = 0;
    let failed = 0;
    for (const { key, review: current, fileName } of taken) {
      const { receipt } = current;
      const accepted = matchings.current.get(key)?.accepted;
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
            const found = current.chosen.has(index) ? accepted?.(index) : undefined;
            return {
              name: (line.name.trim() === '' ? t.fallbackNames[line.kind] : line.name).slice(
                0,
                120,
              ),
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
                ? {
                    location: (matchCategoryByName(line.name) ?? fallbackCategory())
                      .defaultLocation,
                  }
                : {}),
              ...(found === undefined ? {} : { gtin: found.gtin, productName: found.name }),
            };
          }),
        });
        done.add(key);
        if (result.duplicate) {
          known.push({ fileName, text: t.alreadyKnown });
        } else {
          articles += result.itemIds.length;
        }
      } catch {
        failed += 1;
      }
    }
    setBusy(false);
    // A failed receipt stays on the page: a retry cannot import anything twice (fixed commandId).
    setSections((previous) => previous.filter((section) => !done.has(section.key)));
    if (failed === 0 && known.length === 0) {
      void navigate('/inventory');
      return;
    }
    setLeftOut((previous) => [...previous, ...known]);
    const imported = done.size - known.length;
    setStatus(
      [
        imported > 0 ? t.done(articles, imported) : '',
        known.length > 0 ? t.duplicate(known.length) : '',
        failed > 0 ? t.saveFailed : '',
      ]
        .filter(Boolean)
        .join(' '),
    );
    if (failed === 0) {
      setSections([]);
    }
  }

  function change(key: string, patch: Partial<Section>) {
    setSections((previous) =>
      previous.map((section) => (section.key === key ? { ...section, ...patch } : section)),
    );
  }

  const several = sections.length > 1;
  const totals = batchTotals(
    sections.map((section) => ({
      excluded: section.excluded,
      chosen: section.review.chosen,
    })),
  );
  const takeButton = (
    <Button fullWidth disabled={busy || totals.articles === 0} onClick={() => void takeAll()}>
      {several ? t.takeAll(totals.articles, totals.receipts) : t.take(totals.articles)}
    </Button>
  );

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
            void start(files);
          }}
        />
      </label>
      <p role="status" className="mt-2 text-sm font-semibold text-basil-800">
        {status}
      </p>
      {leftOut.length === 0 ? null : (
        <div className="mt-2 text-sm text-ink-muted">
          <p className="font-semibold">{t.leftOut}</p>
          <ul className="mt-1 space-y-1">
            {leftOut.map((file, position) => (
              <li key={`${String(position)}-${file.fileName}`} className="break-words">
                {file.fileName}: {file.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {sections.length === 0 ? <p className="text-xs text-ink-muted">{t.trademarks}</p> : null}

      {sections.length === 0 ? null : (
        <div className="mt-4 space-y-4">
          {several ? takeButton : null}
          {sections.map((section) => (
            <ReceiptReview
              key={section.key}
              id={section.key}
              review={section.review}
              onChange={(review) => {
                change(section.key, { review });
              }}
              collapsible={several}
              excluded={section.excluded}
              onExcludedChange={(excluded) => {
                change(section.key, { excluded });
              }}
              {...(several ? {} : { afterSum: takeButton })}
              onMatching={(matching) => {
                matchings.current.set(section.key, matching);
              }}
            />
          ))}
          {takeButton}
        </div>
      )}
    </Card>
  );
}
