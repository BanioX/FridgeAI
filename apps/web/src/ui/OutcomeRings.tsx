import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

const SIZE = 96;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Ring {
  label: string;
  /** 0–1 */
  share: number;
  value: string;
  detail: string;
  /** Onyx for «Verwertet», red for «Entsorgt» (Alban, 8.11.2026). */
  tone: 'onyx' | 'danger';
  /** Where a tap leads, e.g. the journal with only what was thrown away (Alban, 8.11.2026). */
  to?: string;
}

function OneRing({ label, share, value, detail, tone, to }: Ring) {
  const percent = Math.round(share * 100);
  const stroke = tone === 'onyx' ? 'var(--color-onyx)' : 'var(--color-danger)';
  const ring = (
    <div
      role="img"
      aria-label={`${label}: ${String(percent)} %, ${value}, ${detail}`}
      className="flex flex-col items-center gap-1 text-center"
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-surface-muted)"
          strokeWidth={STROKE}
        />
        {percent === 0 ? null : (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${String(CIRCUMFERENCE * share)} ${String(CIRCUMFERENCE)}`}
            transform={`rotate(-90 ${String(SIZE / 2)} ${String(SIZE / 2)})`}
          />
        )}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-ink font-display text-lg font-semibold tabular-nums"
        >
          {percent} %
        </text>
      </svg>
      <span
        className={`inline-flex items-center gap-0.5 font-semibold ${tone === 'onyx' ? 'text-ink' : 'text-danger'}`}
      >
        {label}
        {to === undefined ? null : <ChevronRight size={16} aria-hidden="true" />}
      </span>
      <span className="font-display text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-sm text-ink-muted">{detail}</span>
    </div>
  );
  return to === undefined ? (
    ring
  ) : (
    <Link
      to={to}
      className="-m-2 rounded-2xl p-2 transition-colors hover:bg-surface-muted active:bg-surface-muted"
    >
      {ring}
    </Link>
  );
}

/**
 * «Verwertet» and «Entsorgt» as two round rings side by side (Alban, 8.11.2026: «runde schwarze
 * und rote Kreise»): what share of the closed food was used and what was thrown away, by value.
 * Each ring is one image with its numbers as text for screen readers.
 */
export function OutcomeRings({
  used,
  wasted,
}: {
  used: Omit<Ring, 'tone'>;
  wasted: Omit<Ring, 'tone'>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <OneRing {...used} tone="onyx" />
      <OneRing {...wasted} tone="danger" />
    </div>
  );
}
