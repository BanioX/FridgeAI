import { PACK_SEGMENTS_MAX, type PackLeft } from '@fridgeai/core';
import { formatPieces } from './quantity-text';

const SIZE = 44;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const LENGTH = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

/**
 * What is left of a pack of pieces, «7 von 10» (Alban, 12.11.2026): one segment per slice or piece
 * like a cut cake, so it never reads as the shelf score ring next to it. Bigger packs show one
 * arc. The number in the middle is what is left.
 */
export function PackRing({ pack, label }: { pack: PackLeft; label: string }) {
  const count = Math.ceil(pack.start);
  const segmented = count <= PACK_SEGMENTS_MAX;
  const gap = segmented ? Math.min(3, (LENGTH / count) * 0.35) : 0;
  const step = segmented ? LENGTH / count : LENGTH;
  const arcs = segmented
    ? Array.from({ length: count }, (_, index) => ({
        index,
        // Share of this segment still there: full, half after «Halb», or empty.
        filled: Math.min(1, Math.max(0, pack.left - index)),
      }))
    : [{ index: 0, filled: pack.left / pack.start }];
  return (
    <svg
      role="img"
      aria-label={label}
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
      className="shrink-0"
    >
      {arcs.map(({ index, filled }) => {
        const rotate = `rotate(${String(-90 + (index * 360 * step) / LENGTH)} ${String(CENTER)} ${String(CENTER)})`;
        const length = step - gap;
        return (
          <g key={index} transform={rotate}>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeDasharray={`${String(length)} ${String(LENGTH)}`}
              className="stroke-line"
            />
            {filled > 0 ? (
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                strokeDasharray={`${String(length * filled)} ${String(LENGTH)}`}
                className="text-ink"
              />
            ) : null}
          </g>
        );
      })}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="fill-ink text-[15px] font-semibold"
      >
        {formatPieces(pack.left)}
      </text>
    </svg>
  );
}
