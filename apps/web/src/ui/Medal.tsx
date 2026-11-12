import type { LucideIcon } from 'lucide-react';

/** Silver ring (I), Smaragd ring on basil-50 (II), Onyx filled (III), dashed and open. */
export type MedalLook = 'silver' | 'emerald' | 'onyx' | 'open';

const SIZE = 56;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LOOKS: Record<MedalLook, { ring: string; fill: string; icon: string }> = {
  silver: { ring: 'var(--color-silver)', fill: 'var(--color-surface)', icon: 'text-ink' },
  emerald: {
    ring: 'var(--color-basil-700)',
    fill: 'var(--color-basil-50)',
    icon: 'text-basil-700',
  },
  onyx: { ring: 'var(--color-onyx)', fill: 'var(--color-onyx)', icon: 'text-white' },
  open: { ring: 'var(--color-silver)', fill: 'transparent', icon: 'text-ink-muted' },
};

interface MedalProps {
  icon: LucideIcon;
  look: MedalLook;
  /** Open medals: how far the progress arc runs, 0 to 1. */
  fraction?: number;
  name: string;
  /** The spoken text, with tier, day and progress; the visible parts are hidden from readers. */
  label: string;
  /** «noch 3 Rettungen»: progress as text, not only as an arc. */
  missing?: string | null;
  /** The «Wofür» line, if the page shows it. */
  about?: string;
}

/**
 * A medal (docs/abzeichen.md, «Aussehen»): 56 px round, a Lucide symbol with a 1.75 line, the name
 * below. Not yet reached: a dashed silver ring with an arc for the progress, and the progress as
 * text. The whole medal reads as one image with one sentence.
 */
export function Medal({ icon: Icon, look, fraction = 0, name, label, missing, about }: MedalProps) {
  const colors = LOOKS[look];
  const open = look === 'open';
  return (
    <div
      role="img"
      aria-label={label}
      className="flex w-full min-w-0 flex-col items-center text-center break-words hyphens-auto"
    >
      <div aria-hidden="true" className="relative size-14 shrink-0">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill={colors.fill}
            stroke={colors.ring}
            strokeWidth={STROKE}
            strokeDasharray={open ? '3 4' : undefined}
          />
          {open && fraction > 0 ? (
            <circle
              data-testid="medal-arc"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-basil-500)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${String(CIRCUMFERENCE * fraction)} ${String(CIRCUMFERENCE)}`}
              transform={`rotate(-90 ${String(SIZE / 2)} ${String(SIZE / 2)})`}
            />
          ) : null}
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center ${colors.icon}`}>
          <Icon size={24} strokeWidth={1.75} />
        </span>
      </div>
      <p aria-hidden="true" className="mt-1.5 text-[13px] leading-tight font-semibold">
        {name}
      </p>
      {missing === undefined || missing === null ? null : (
        <p aria-hidden="true" className="text-xs text-ink-muted">
          {missing}
        </p>
      )}
      {about === undefined ? null : (
        <p aria-hidden="true" className="mt-0.5 text-xs text-ink-muted">
          {about}
        </p>
      )}
    </div>
  );
}
