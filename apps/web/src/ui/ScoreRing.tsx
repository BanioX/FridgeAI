/** Colour of the arc by level: heikel red, mittel wheat, robust Smaragd (ADR-0038). */
const ARC = {
  high: 'text-today',
  medium: 'text-wheat',
  low: 'text-basil-700',
} as const;

const SIZE = 44;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const LENGTH = 2 * Math.PI * RADIUS;

/**
 * A small ring with the shelf score (1 to 10) in its middle, like the rescue ring of the report.
 * The arc shows the share of 10, starting at 12 o'clock; the label says it in words.
 */
export function ScoreRing({
  score,
  level,
  label,
}: {
  score: number;
  level: keyof typeof ARC;
  label: string;
}) {
  const share = Math.min(10, Math.max(1, score)) / 10;
  return (
    <svg
      role="img"
      aria-label={label}
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
      className="shrink-0"
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE}
        className="stroke-line"
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${String(share * LENGTH)} ${String(LENGTH)}`}
        transform={`rotate(-90 ${String(SIZE / 2)} ${String(SIZE / 2)})`}
        className={ARC[level]}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="fill-ink text-[15px] font-semibold"
      >
        {score}
      </text>
    </svg>
  );
}
