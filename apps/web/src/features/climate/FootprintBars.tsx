import { useId } from 'react';
import { messages } from '../../app/messages.de-CH';

const t = messages.climate;

const WIDTH = 300;
const HEIGHT = 12;
const GAP = 2;
/** A value above zero is always visible, however small next to the other part. */
const MIN_PART = 4;

export interface BarRow {
  key: string;
  label: string;
  rescued: number;
  wasted: number;
  /** The two values as text, e.g. «2,4 kg». */
  rescuedText: string;
  wastedText: string;
}

/** The widths of the two parts in a bar of `WIDTH` units; the gap sits between them. */
export function barParts(rescued: number, wasted: number): { rescued: number; wasted: number } {
  const total = rescued + wasted;
  if (total <= 0) {
    return { rescued: 0, wasted: 0 };
  }
  if (rescued <= 0 || wasted <= 0) {
    return { rescued: rescued > 0 ? WIDTH : 0, wasted: wasted > 0 ? WIDTH : 0 };
  }
  const room = WIDTH - GAP;
  const first = Math.min(Math.max((room * rescued) / total, MIN_PART), room - MIN_PART);
  return { rescued: first, wasted: room - first };
}

function Bar({ rescued, wasted }: Pick<BarRow, 'rescued' | 'wasted'>) {
  const clip = useId();
  const parts = barParts(rescued, wasted);
  const wastedX = parts.rescued > 0 && parts.wasted > 0 ? parts.rescued + GAP : parts.rescued;
  return (
    <svg
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      className="mt-1 block w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clip}>
          <rect width={WIDTH} height={HEIGHT} rx={HEIGHT / 2} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width={WIDTH} height={HEIGHT} fill="var(--color-surface-muted)" />
        {parts.rescued > 0 ? (
          <rect width={parts.rescued} height={HEIGHT} fill="var(--color-basil-600)" />
        ) : null}
        {parts.wasted > 0 ? (
          <rect x={wastedX} width={parts.wasted} height={HEIGHT} fill="var(--color-danger)" />
        ) : null}
      </g>
    </svg>
  );
}

/**
 * Per metric a two-part bar: rescued (green) and entsorgt (red), side by side in one track. The
 * numbers are text beside every bar, so colour is never the only sign; the whole chart is one
 * image with all values in its label for screen readers.
 */
export function FootprintBars({ rows }: { rows: readonly BarRow[] }) {
  const label = t.chartLabel(
    rows.map((row) => t.chartRow(row.label, row.rescuedText, row.wastedText)).join('; '),
  );
  return (
    <figure role="img" aria-label={label} className="space-y-3">
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.key}>
            <p className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-semibold">{row.label}</span>
              <span className="text-sm tabular-nums">
                <span className="text-basil-800">
                  {row.rescuedText} {t.rescuedWord}
                </span>
                {' · '}
                <span className="text-danger">
                  {row.wastedText} {t.wastedWord}
                </span>
              </span>
            </p>
            <Bar rescued={row.rescued} wasted={row.wasted} />
          </li>
        ))}
      </ul>
    </figure>
  );
}
