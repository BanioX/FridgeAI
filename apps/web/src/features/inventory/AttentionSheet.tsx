import type { Attention, AttentionReason } from '@fridgeai/core';
import { CalendarClock, Coins, Hourglass, Repeat, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { messages } from '../../app/messages.de-CH';
import { useMoney } from '../../app/money';
import { createPortal } from 'react-dom';

const t = messages.attention;

const REASON_ICONS: Record<AttentionReason['kind'], LucideIcon> = {
  use_by: CalendarClock,
  perishable: Hourglass,
  pricey: Coins,
  often_wasted: Repeat,
};

/**
 * The overlay behind the (i) on the item page (ADR-0073): why the article is «im Blick», in one or
 * two short lines, and one tip. Focus goes in, Tab stays inside, Escape and «Schliessen» close it.
 * It does not animate, so it already respects `prefers-reduced-motion`.
 */
export function AttentionSheet({
  attention,
  onClose,
}: {
  attention: Attention;
  onClose: () => void;
}) {
  const money = useMoney();
  const dialog = useRef<HTMLDivElement>(null);

  // Focus goes into the sheet and back to the (i) that opened it.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.focus();
    return () => {
      opener?.focus();
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || dialog.current === null) {
      return;
    }
    // The only control is «Schliessen»: keep Tab on it.
    event.preventDefault();
    dialog.current.querySelector<HTMLElement>('button')?.focus();
  };

  const text = (reason: AttentionReason): string => {
    switch (reason.kind) {
      case 'use_by':
        return t.reasons.use_by;
      case 'perishable':
        return t.reasons.perishable;
      case 'pricey':
        return t.reasons.pricey(money.format(reason.rappen));
      case 'often_wasted':
        return t.reasons.often_wasted(reason.times);
    }
  };
  const tip =
    attention.tip === undefined
      ? undefined
      : attention.tip.kind === 'freeze'
        ? t.tipFreeze
        : attention.tip.text;

  // On the body, so the tab bar does not cover the bottom of the sheet (ADR-0082).
  return createPortal(
    <div className="sheet-backdrop">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="attention-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="sheet-panel max-h-[92dvh] space-y-4 overflow-y-auto outline-none"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="attention-title" className="font-display text-xl font-semibold">
            {t.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-basil-700 hover:bg-basil-50"
          >
            {t.close}
          </button>
        </div>
        <ul className="space-y-3">
          {attention.reasons.map((reason) => {
            const Icon = REASON_ICONS[reason.kind];
            return (
              <li key={reason.kind} className="flex items-start gap-3">
                <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-muted" />
                <span>{text(reason)}</span>
              </li>
            );
          })}
        </ul>
        {tip === undefined ? null : <p className="text-sm text-ink-muted">{tip}</p>}
      </div>
    </div>,
    document.body,
  );
}
