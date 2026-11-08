import {
  parseScannedCode,
  type Nutrition,
  type OperationOutput,
  type ProductLookup,
} from '@fridgeai/core';
import { Check, ScanBarcode, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { BarcodeScanner } from '../scan/BarcodeScanner';
import { nutritionFacts } from './receipt-steps';

const t = messages.receiptUpload.match;
const steps = messages.receiptUpload.steps;

export type ReceiptMatch = NonNullable<OperationOutput<'receipts.matchLine'>['match']>;

/** How a hit came about: the open database, an earlier receipt, or a barcode scanned right here. */
type Found = ReceiptMatch | (Omit<ReceiptMatch, 'source'> & { source: 'scan' });

interface LineMatch {
  match: Found;
  /** Pack picture, once the barcode was looked up (stored on the device as a data URL). */
  image?: string;
  /** Facts per 100 g/ml and Nutri-Score of the product, for the preview in the article card. */
  nutrition?: Nutrition;
  nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
}

interface MatchState {
  matches: ReadonlyMap<number, LineMatch>;
  /** «Ja» or «Nein» per line; only «Ja» goes into the inventory with the product. */
  decisions: ReadonlyMap<number, 'yes' | 'no'>;
  /** Lines already asked, to tell «Kein Treffer» from «noch nicht geprüft». */
  asked: ReadonlySet<number>;
  /** Per line, what a scanned barcode turned out to be when it did not help. */
  scanNotes: ReadonlyMap<number, string>;
  scanning: number | null;
  phase: 'idle' | 'running' | 'done' | 'unavailable';
  done: number;
  total: number;
}

/** Picture and facts of a looked-up product, as far as there are any. */
function preview(
  looked: { product: ProductLookup | null; image: string | undefined } | undefined,
): Pick<LineMatch, 'image' | 'nutrition' | 'nutriScore'> {
  return {
    ...(looked?.image === undefined ? {} : { image: looked.image }),
    ...(looked?.product?.nutrition === undefined ? {} : { nutrition: looked.product.nutrition }),
    ...(looked?.product?.nutriScore === undefined ? {} : { nutriScore: looked.product.nutriScore }),
  };
}

const IDLE: MatchState = {
  matches: new Map(),
  decisions: new Map(),
  asked: new Set(),
  scanNotes: new Map(),
  scanning: null,
  phase: 'idle',
  done: 0,
  total: 0,
};

/**
 * Matching a read receipt with Open Food Facts (ADR-0036). Alban, 7.11.2026: it starts by itself
 * after reading, and the person answers «Ist es das?» with «Ja» or «Nein» per hit. Only the
 * printed product names go out, one after the other. A line without a hit can get its barcode
 * scanned; products the household confirmed on an earlier receipt are known without network.
 */
export function useReceiptMatching() {
  const { householdId, inventory, today } = useAppData();
  const [state, setState] = useState<MatchState>(IDLE);
  const run = useRef(0);

  useEffect(
    () => () => {
      run.current += 1;
    },
    [],
  );

  /** Name, facts and picture for a barcode; caches them for the import (only the number goes out). */
  async function lookup(gtin: ReceiptMatch['gtin']) {
    const found = await inventory['products.lookup']({ householdId, gtin }).catch(() => null);
    const image = (await inventory['products.image']({ householdId, gtin }).catch(() => null))
      ?.image?.dataUrl;
    return { product: found?.product ?? null, image };
  }

  /**
   * The picture is stored in the background after the first lookup (catalog cache), so it is
   * usually not there yet when the hit shows. Ask again a few times, on the device only.
   */
  async function pictureLater(index: number, gtin: ReceiptMatch['gtin'], mine: number) {
    for (const wait of [500, 1500, 3500]) {
      await new Promise((resolve) => setTimeout(resolve, wait));
      if (run.current !== mine) {
        return;
      }
      const image = (await inventory['products.image']({ householdId, gtin }).catch(() => null))
        ?.image?.dataUrl;
      if (image !== undefined) {
        setState((previous) => {
          const found = previous.matches.get(index);
          return found === undefined || found.match.gtin !== gtin
            ? previous
            : { ...previous, matches: new Map(previous.matches).set(index, { ...found, image }) };
        });
        return;
      }
    }
  }

  async function start(lines: readonly { index: number; name: string }[]) {
    const mine = (run.current += 1);
    const current = () => run.current === mine;
    setState({ ...IDLE, phase: lines.length === 0 ? 'idle' : 'running', total: lines.length });
    let unavailable = false;
    for (const [position, line] of lines.entries()) {
      if (!current()) {
        return;
      }
      const result = await inventory['receipts.matchLine']({ householdId, name: line.name }).catch(
        () => ({ openDatabase: 'unavailable' as const, match: undefined }),
      );
      unavailable ||= result.openDatabase === 'unavailable';
      const { match } = result;
      const looked = match === undefined ? undefined : await lookup(match.gtin);
      if (!current()) {
        return;
      }
      if (match !== undefined && looked?.image === undefined) {
        void pictureLater(line.index, match.gtin, mine);
      }
      setState((previous) => {
        const matches = new Map(previous.matches);
        const decisions = new Map(previous.decisions);
        if (match !== undefined) {
          matches.set(line.index, { match, ...preview(looked) });
          // Confirmed on an earlier receipt: no need to ask again.
          if (match.source === 'household') {
            decisions.set(line.index, 'yes');
          }
        }
        return {
          ...previous,
          matches,
          decisions,
          asked: new Set([...previous.asked, line.index]),
          done: position + 1,
        };
      });
    }
    if (current() && lines.length > 0) {
      setState((previous) => ({ ...previous, phase: unavailable ? 'unavailable' : 'done' }));
    }
  }

  async function scanned(index: number, raw: string) {
    const gtin = parseScannedCode(raw, today)?.data.gtin;
    if (gtin === undefined) {
      setState((previous) => ({
        ...previous,
        scanNotes: new Map(previous.scanNotes).set(index, t.scanInvalid),
      }));
      return;
    }
    const { product, image } = await lookup(gtin);
    if (product !== null && image === undefined) {
      void pictureLater(index, gtin, run.current);
    }
    setState((previous) => {
      const scanNotes = new Map(previous.scanNotes);
      if (product === null) {
        scanNotes.set(index, t.scanUnknown);
        return { ...previous, scanNotes, scanning: null };
      }
      scanNotes.delete(index);
      const match: Found = {
        gtin,
        name: product.name,
        ...(product.brand === undefined ? {} : { brand: product.brand }),
        ...(product.packSize === undefined ? {} : { packSize: product.packSize }),
        source: 'scan',
        confidence: 'sure',
      };
      return {
        ...previous,
        // The person scanned this very pack: that is the confirmation.
        matches: new Map(previous.matches).set(index, { match, ...preview({ product, image }) }),
        decisions: new Map(previous.decisions).set(index, 'yes'),
        scanNotes,
        scanning: null,
      };
    });
  }

  return {
    ...state,
    start,
    scanned,
    reset: () => {
      run.current += 1;
      setState(IDLE);
    },
    decide: (index: number, decision: 'yes' | 'no') => {
      setState((previous) => ({
        ...previous,
        decisions: new Map(previous.decisions).set(index, decision),
      }));
    },
    scan: (index: number | null) => {
      setState((previous) => ({ ...previous, scanning: index }));
    },
    /** The product to take over for a line: only after «Ja» (or a scan). */
    accepted: (index: number): Found | undefined =>
      state.decisions.get(index) === 'yes' ? state.matches.get(index)?.match : undefined,
  };
}

export type ReceiptMatching = ReturnType<typeof useReceiptMatching>;

/** Progress, the one-line privacy note and, at the end, the hint to scan the rest. */
export function MatchPanel({ matching }: { matching: ReceiptMatching }) {
  const found = matching.matches.size;
  const status =
    matching.phase === 'running'
      ? t.progress(matching.done, matching.total, found)
      : matching.phase === 'done'
        ? t.done(found, matching.total)
        : matching.phase === 'unavailable'
          ? t.unavailable
          : '';
  return (
    <div className="space-y-2">
      <p role="status" className="text-sm font-semibold text-basil-800">
        {status}
      </p>
      {matching.phase === 'idle' ? null : <p className="text-sm text-ink-muted">{t.note}</p>}
      {matching.phase !== 'running' && matching.asked.size > found ? (
        <Card variant="tip" className="flex gap-3 text-sm">
          <ScanBarcode size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{t.hint}</p>
        </Card>
      ) : null}
    </div>
  );
}

const SOURCE_LABEL = { household: t.known, scan: t.scanned } as const;

/** Key values per 100 g/ml and the Nutri-Score chip, in one compact line. */
function Facts({ found }: { found: LineMatch }) {
  const facts = nutritionFacts(found.nutrition);
  if (facts === null && found.nutriScore === undefined) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
      {facts === null ? null : (
        <p>
          <span>{steps.per[facts.basis]}: </span>
          {facts.values.map((value) => steps.facts[value.key](value.text)).join(' · ')}
        </p>
      )}
      {found.nutriScore === undefined ? null : (
        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 font-semibold whitespace-nowrap text-ink">
          {steps.nutriScore(found.nutriScore.toUpperCase())}
        </span>
      )}
    </div>
  );
}

/**
 * Step «Produkt» of an article card: the hit shown larger (picture, name, brand, size, key values)
 * with «Ist es das?» «Ja»/«Nein», or «Barcode scannen» when there is none.
 */
export function ProductStep({
  matching,
  index,
  name,
  asks,
}: {
  matching: ReceiptMatching;
  index: number;
  name: string;
  /** False for loose produce and weighed goods: nothing to confirm. */
  asks: boolean;
}) {
  const found = matching.matches.get(index);
  const decision = matching.decisions.get(index);
  const note = matching.scanNotes.get(index);

  if (!asks) {
    return <p className="text-sm text-ink-muted">{steps.loose}</p>;
  }

  if (matching.scanning === index) {
    return (
      <div className="space-y-2">
        <BarcodeScanner
          onCode={(raw) => {
            void matching.scanned(index, raw);
          }}
        />
        {note === undefined ? null : <p className="text-sm text-today">{note}</p>}
        <Button
          variant="ghost"
          onClick={() => {
            matching.scan(null);
          }}
        >
          {t.cancelScan}
        </Button>
      </div>
    );
  }

  if (found !== undefined && decision !== 'no') {
    const { match, image } = found;
    const label =
      match.source === 'off'
        ? match.confidence === 'sure'
          ? t.sure
          : t.maybe
        : SOURCE_LABEL[match.source];
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {image === undefined ? null : (
            <img
              src={image}
              alt=""
              className="size-16 shrink-0 rounded-xl bg-white object-contain"
            />
          )}
          <p className="min-w-0 flex-1 text-sm">
            <span className="block text-ink-muted">{label}</span>
            <span className="line-clamp-3 block font-semibold break-words">
              {[match.name, match.brand, match.packSize].filter(Boolean).join(' · ')}
            </span>
          </p>
        </div>
        <Facts found={found} />
        <div className="flex items-center gap-2">
          <span className="mr-auto text-sm font-semibold">
            {decision === 'yes' ? t.taken : t.question}
          </span>
          <button
            type="button"
            aria-pressed={decision === 'yes'}
            aria-label={t.yesFor(match.name)}
            onClick={() => {
              matching.decide(index, 'yes');
            }}
            className={`inline-flex min-h-11 items-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors ${
              decision === 'yes'
                ? 'bg-basil-700 text-white'
                : 'border border-line bg-surface text-basil-800 hover:bg-surface-muted'
            }`}
          >
            <Check size={16} aria-hidden="true" />
            {t.yes}
          </button>
          <button
            type="button"
            aria-label={t.noFor(match.name)}
            onClick={() => {
              matching.decide(index, 'no');
            }}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            <X size={16} aria-hidden="true" />
            {t.no}
          </button>
        </div>
      </div>
    );
  }

  if (!matching.asked.has(index) && decision !== 'no') {
    return matching.phase === 'running' ? (
      <p className="text-sm text-ink-muted">{steps.checking}</p>
    ) : null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-auto text-sm text-ink-muted">
        {note ?? (decision === 'no' ? t.rejected : t.none)}
      </span>
      <button
        type="button"
        aria-label={t.scanFor(name)}
        onClick={() => {
          matching.scan(index);
        }}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-basil-800 hover:bg-surface-muted"
      >
        <ScanBarcode size={16} aria-hidden="true" />
        {t.scan}
      </button>
    </div>
  );
}
