import { CalendarClock, LayoutGrid } from 'lucide-react';
import type { ReactNode } from 'react';
import { messages } from '../../app/messages.de-CH';
import type { InventoryView } from './inventory-view';
import { KIND_EMOJI, type Kind } from './item-kinds';

const t = messages.inventory.view;
const headingId = (kind: Kind) => `kind-${kind}`;

/** «Nach Ablauf» | «Nach Art»: a quieter second switch under the Lagerort tabs. */
export function ViewSwitch({
  view,
  onChange,
}: {
  view: InventoryView;
  onChange: (view: InventoryView) => void;
}) {
  const options = [
    { value: 'expiry', label: t.expiry, icon: CalendarClock },
    { value: 'kind', label: t.kind, icon: LayoutGrid },
  ] as const;
  return (
    <div
      role="group"
      aria-label={t.label}
      className="grid grid-cols-2 gap-0.5 rounded-xl bg-surface-muted p-0.5"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = value === view;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              onChange(value);
            }}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[0.625rem] text-[0.9375rem] transition-colors ${
              active
                ? 'bg-surface font-semibold text-ink shadow-card'
                : 'font-medium text-ink-muted hover:text-ink'
            }`}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return typeof (window.matchMedia as unknown) === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/** Tile tap: the block comes into view and its heading takes the focus. */
function jumpTo(kind: Kind) {
  const heading = document.getElementById(headingId(kind));
  if (heading === null) {
    return;
  }
  if (typeof (heading.scrollIntoView as unknown) === 'function') {
    heading.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  }
  heading.focus({ preventScroll: true });
}

export interface KindSummary {
  kind: Kind;
  count: number;
  /** Items due in the next days. */
  soon: number;
  /** Items due today or over: they come first on the chip («2 jetzt»). */
  now: number;
}

/** One tile per kind: picture, count and what is due soon, like an overview of shelves. */
export function KindTiles({ kinds }: { kinds: readonly KindSummary[] }) {
  return (
    <ul aria-label={t.tilesLabel} className="grid grid-cols-3 gap-2">
      {kinds.map(({ kind, count, soon, now }) => {
        const label = messages.inventory.kinds[kind];
        return (
          <li key={kind}>
            <button
              type="button"
              aria-label={t.tile(label, count, now, soon)}
              onClick={() => {
                jumpTo(kind);
              }}
              className="flex h-full w-full flex-col items-start gap-2 rounded-2xl bg-surface p-2.5 text-left shadow-card transition-colors hover:bg-surface-muted active:bg-surface-muted"
            >
              <span className="flex w-full items-start justify-between gap-1">
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-xl bg-oat text-xl leading-none"
                >
                  {KIND_EMOJI[kind]}
                </span>
                <span className="text-[1.375rem] leading-none font-bold tabular-nums">{count}</span>
              </span>
              <span className="text-[0.8125rem] leading-tight font-semibold hyphens-calm">
                {label}
              </span>
              {now > 0 ? (
                <span className="rounded-full bg-today-bg px-2 py-0.5 text-xs font-semibold text-today">
                  {t.now(now)}
                </span>
              ) : soon > 0 ? (
                <span className="rounded-full bg-soon-bg px-2 py-0.5 text-xs font-semibold text-soon">
                  {t.soon(soon)}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** One kind as its own block: heading with picture and count, then the rows, soonest first. */
export function KindSection({
  kind,
  count,
  children,
}: {
  kind: Kind;
  count: number;
  children: ReactNode;
}) {
  const label = messages.inventory.kinds[kind];
  return (
    <section
      aria-labelledby={headingId(kind)}
      className="scroll-mt-[calc(env(safe-area-inset-top)+1rem)] overflow-hidden rounded-2xl bg-surface shadow-card"
    >
      <h2
        id={headingId(kind)}
        tabIndex={-1}
        className="flex scroll-mt-[calc(env(safe-area-inset-top)+1rem)] items-center gap-3 border-b border-line px-4 py-3 outline-none"
      >
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-xl bg-oat text-xl leading-none"
        >
          {KIND_EMOJI[kind]}
        </span>
        <span className="min-w-0 flex-1 text-[1.0625rem] font-semibold hyphens-calm">{label}</span>
        <span className="text-[0.9375rem] text-ink-muted tabular-nums">
          <span aria-hidden="true">{count}</span>
          <span className="sr-only">{`, ${t.count(count)}`}</span>
        </span>
      </h2>
      <ul>{children}</ul>
    </section>
  );
}
