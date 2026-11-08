import { messages } from '../../app/messages.de-CH';
import { growthOf, leafAngles } from './growth';

const t = messages.today.growth;

/** Size of the whole radish by stage: it grows with the leaves. */
const SCALE = { seed: 0.5, sprout: 0.66, young: 0.8, grown: 0.92, model: 1 } as const;

/** The radish of the app icon, in its coordinates (512 × 512, crown at 256/176). */
const ROOT =
  'M256 166c62 0 80 44 76 96-4 68-42 130-70 184-3 7-9 7-12 0-28-54-66-116-70-184-4-52 14-96 76-96z';
const COLLAR = 'M190 214c8-34 32-48 66-48s58 14 66 48c-20-10-42-14-66-14s-46 4-66 14z';
const LEAF = 'M256 186c-46-48-52-120 0-166 52 46 46 118 0 166z';
const ROOT_LINES = ['M206 262q14 6 28 3', 'M286 300q-12 6-26 4', 'M222 340q12 5 22 2'];

/**
 * «Dein Rettich» on Start (ADR-0043): one leaf for each confirmed rescue this month, a bigger
 * radish from stage to stage, and the onyx tile of «Vorbild» at the milestone.
 */
export function RettichGrowth({ rescues }: { rescues: number }) {
  const growth = growthOf(rescues);
  const stage = t.stages[growth.stage];
  const scale = SCALE[growth.stage];
  const angles = leafAngles(growth.leaves);
  const model = growth.stage === 'model';
  return (
    <div className="flex items-center gap-4">
      <svg
        role="img"
        aria-label={t.label(stage, growth.leaves)}
        viewBox="0 0 512 512"
        className="size-20 shrink-0"
      >
        <rect
          width="512"
          height="512"
          rx="112"
          className={model ? 'fill-onyx' : 'fill-basil-700'}
        />
        {model ? (
          <rect
            x="14"
            y="14"
            width="484"
            height="484"
            rx="100"
            fill="none"
            strokeWidth="8"
            className="stroke-silver"
          />
        ) : null}
        <g transform={`translate(256 300) scale(${String(scale)}) translate(-256 -300)`}>
          {angles.map((angle, index) => (
            <g key={angle} transform={`rotate(${String(angle)} 256 176)`}>
              <path
                d={LEAF}
                fill={index % 2 === 0 ? '#59a884' : '#b4e0ca'}
                className={index === angles.length - 1 ? 'leaf-grow' : undefined}
              />
            </g>
          ))}
          <path d={ROOT} fill="#f8f6f1" />
          <path d={COLLAR} fill="#d7f1e3" />
          <g fill="none" stroke="#d9d3c4" strokeWidth="7" strokeLinecap="round">
            {ROOT_LINES.map((line) => (
              <path key={line} d={line} />
            ))}
          </g>
        </g>
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-muted">{t.title}</p>
        <p className="font-display text-xl font-semibold">{stage}</p>
        <p className="text-sm text-ink-muted">
          {t.rescues(rescues)}
          {growth.next === null
            ? null
            : ` · ${t.next(growth.next.missing, t.stages[growth.next.stage])}`}
        </p>
      </div>
    </div>
  );
}
