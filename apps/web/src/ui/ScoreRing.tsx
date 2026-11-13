const SIZE = 44;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const LENGTH = 2 * Math.PI * RADIUS;

/**
 * A small ring with the shelf score (1 to 10) in its middle, like the rescue ring of the report.
 * The arc shows the share of 10, starting at 12 o'clock, in Onyx for every level (ADR-0075): the
 * label and the text next to it say whether it is heikel, mittel or robust.
 */
export function ScoreRing({ score, label }: { score: number; label: string }) {
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
        className="text-ink"
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
