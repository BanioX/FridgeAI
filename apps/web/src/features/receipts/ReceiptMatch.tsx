import type { OperationOutput } from '@fridgeai/core';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';

const t = messages.receiptUpload.match;

export type ReceiptMatch = NonNullable<OperationOutput<'receipts.matchLine'>['match']>;

interface LineMatch {
  match: ReceiptMatch;
  /** Pack picture, once the barcode was looked up (stored on the device as a data URL). */
  image?: string;
}

interface MatchState {
  matches: ReadonlyMap<number, LineMatch>;
  confirmed: ReadonlySet<number>;
  phase: 'idle' | 'running' | 'done' | 'unavailable';
  done: number;
  total: number;
}

const IDLE: MatchState = {
  matches: new Map(),
  confirmed: new Set(),
  phase: 'idle',
  done: 0,
  total: 0,
};

/**
 * «Mit Open Food Facts abgleichen» (ADR-0036): one tap sends the printed names of the chosen lines,
 * one after the other, and nothing else. Each hit waits for the person's «Passt»; products the
 * household confirmed on an earlier receipt are known without the network and pre-confirmed.
 */
export function useReceiptMatching() {
  const { householdId, inventory } = useAppData();
  const [state, setState] = useState<MatchState>(IDLE);
  const run = useRef(0);

  useEffect(
    () => () => {
      run.current += 1;
    },
    [],
  );

  async function start(lines: readonly { index: number; name: string }[]) {
    const mine = (run.current += 1);
    const current = () => run.current === mine;
    setState({ ...IDLE, phase: 'running', total: lines.length });
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
      let image: string | undefined;
      if (match !== undefined) {
        // Barcode lookup: caches name, facts and picture for the import (only the number goes out).
        await inventory['products.lookup']({ householdId, gtin: match.gtin }).catch(() => null);
        image = (
          await inventory['products.image']({ householdId, gtin: match.gtin }).catch(() => null)
        )?.image?.dataUrl;
      }
      if (!current()) {
        return;
      }
      setState((previous) => {
        const matches = new Map(previous.matches);
        const confirmed = new Set(previous.confirmed);
        if (match !== undefined) {
          matches.set(line.index, { match, ...(image === undefined ? {} : { image }) });
          if (match.source === 'household') {
            confirmed.add(line.index);
          }
        }
        return { ...previous, matches, confirmed, done: position + 1 };
      });
    }
    if (current()) {
      setState((previous) => ({ ...previous, phase: unavailable ? 'unavailable' : 'done' }));
    }
  }

  return {
    ...state,
    start,
    reset: () => {
      run.current += 1;
      setState(IDLE);
    },
    toggle: (index: number) => {
      setState((previous) => {
        const confirmed = new Set(previous.confirmed);
        if (!confirmed.delete(index)) {
          confirmed.add(index);
        }
        return { ...previous, confirmed };
      });
    },
  };
}

export type ReceiptMatching = ReturnType<typeof useReceiptMatching>;

/** The button, the one-line privacy note and the progress. */
export function MatchPanel({
  matching,
  lines,
}: {
  matching: ReceiptMatching;
  lines: readonly { index: number; name: string }[];
}) {
  const found = matching.matches.size;
  const status =
    matching.phase === 'running'
      ? t.progress(matching.done, matching.total)
      : matching.phase === 'done'
        ? t.done(found, matching.total)
        : matching.phase === 'unavailable'
          ? t.unavailable
          : '';
  return (
    <div className="space-y-2">
      {matching.phase === 'idle' && lines.length > 0 ? (
        <>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              void matching.start(lines);
            }}
          >
            {t.button}
          </Button>
          <p className="text-sm text-ink-muted">{t.note}</p>
        </>
      ) : null}
      <p role="status" className="text-sm font-semibold text-basil-800">
        {status}
      </p>
    </div>
  );
}

/** Under a receipt line: the product found and «Passt»; nothing while there is no hit. */
export function MatchRow({ matching, index }: { matching: ReceiptMatching; index: number }) {
  const found = matching.matches.get(index);
  if (found === undefined) {
    return null;
  }
  const { match, image } = found;
  const confirmed = matching.confirmed.has(index);
  const label =
    match.source === 'household' ? t.known : match.confidence === 'sure' ? t.sure : t.maybe;
  return (
    <div className="flex items-center gap-3 pr-2 pb-3 pl-14">
      {image === undefined ? null : (
        <img src={image} alt="" className="size-10 shrink-0 rounded-lg bg-white object-contain" />
      )}
      <p className="min-w-0 flex-1 text-sm">
        <span className="block text-ink-muted">{label}</span>
        <span className="line-clamp-2 block font-semibold break-words">
          {[match.name, match.brand, match.packSize].filter(Boolean).join(' · ')}
        </span>
      </p>
      <button
        type="button"
        aria-pressed={confirmed}
        aria-label={t.fitsFor(match.name)}
        onClick={() => {
          matching.toggle(index);
        }}
        className={`inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors ${
          confirmed
            ? 'bg-basil-700 text-white'
            : 'border border-line bg-surface text-basil-800 hover:bg-surface-muted'
        }`}
      >
        {confirmed ? <Check size={16} aria-hidden="true" /> : null}
        {t.fits}
      </button>
    </div>
  );
}
