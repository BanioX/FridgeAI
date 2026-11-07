import { parseScannedCode, type OperationOutput } from '@fridgeai/core';
import { Check, ScanBarcode, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { BarcodeScanner } from '../scan/BarcodeScanner';

const t = messages.receiptUpload.match;

export type ReceiptMatch = NonNullable<OperationOutput<'receipts.matchLine'>['match']>;

/** How a hit came about: the open database, an earlier receipt, or a barcode scanned right here. */
type Found = ReceiptMatch | (Omit<ReceiptMatch, 'source'> & { source: 'scan' });

interface LineMatch {
  match: Found;
  /** Pack picture, once the barcode was looked up (stored on the device as a data URL). */
  image?: string;
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
      const image = match === undefined ? undefined : (await lookup(match.gtin)).image;
      if (!current()) {
        return;
      }
      setState((previous) => {
        const matches = new Map(previous.matches);
        const decisions = new Map(previous.decisions);
        if (match !== undefined) {
          matches.set(line.index, { match, ...(image === undefined ? {} : { image }) });
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
        matches: new Map(previous.matches).set(index, {
          match,
          ...(image === undefined ? {} : { image }),
        }),
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

/** Under a receipt line: the hit with «Ist es das?», or «Barcode scannen» when there is none. */
export function MatchRow({
  matching,
  index,
  name,
}: {
  matching: ReceiptMatching;
  index: number;
  name: string;
}) {
  const found = matching.matches.get(index);
  const decision = matching.decisions.get(index);
  const note = matching.scanNotes.get(index);

  if (matching.scanning === index) {
    return (
      <div className="space-y-2 pr-4 pb-4 pl-14">
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
      <div className="space-y-2 pr-4 pb-3 pl-14">
        <div className="flex items-center gap-3">
          {image === undefined ? null : (
            <img
              src={image}
              alt=""
              className="size-10 shrink-0 rounded-lg bg-white object-contain"
            />
          )}
          <p className="min-w-0 flex-1 text-sm">
            <span className="block text-ink-muted">{label}</span>
            <span className="line-clamp-2 block font-semibold break-words">
              {[match.name, match.brand, match.packSize].filter(Boolean).join(' · ')}
            </span>
          </p>
        </div>
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
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2 pr-4 pb-3 pl-14">
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
