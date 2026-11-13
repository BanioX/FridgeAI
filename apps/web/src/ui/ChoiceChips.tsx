import { useId } from 'react';

interface ChoiceChipsProps<TValue extends string> {
  legend: string;
  /** `danger`: chosen, the option is red instead of Smaragd («Entsorgt», ADR-0075). */
  options: readonly { value: TValue; label: string; danger?: boolean }[];
  /** `null`: nothing chosen yet. */
  value: TValue | null;
  onChange: (value: TValue) => void;
  /** Visually hide the legend when a heading above already says the same. */
  hideLegend?: boolean;
  /** Equal-width segments in one row instead of wrapping chips (for 2–4 short options). */
  segmented?: boolean;
}

const FOCUS =
  'cursor-pointer font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-basil-600';
const CHOSEN = 'bg-basil-700 text-white shadow-card';
const CHOSEN_DANGER = 'bg-danger text-white shadow-card';

/*
 * Chips: capsules that wrap (portions, reasons).
 * Segments: Apple's segmented control (ADR-0021), one rounded track with equal segments and a
 * 13 px label. The chosen segment is filled with the brand colour rather than iOS white, so the
 * state keeps 3:1 contrast (WCAG 1.4.11). Long words such as «Kühlschrank» break with a hyphen on
 * very narrow screens instead of being cut off.
 */
const LOOKS = {
  chips: {
    group: 'flex flex-wrap gap-2',
    option: `flex min-h-11 items-center justify-center rounded-full border px-4 text-sm whitespace-nowrap ${FOCUS}`,
    chosen: `border-basil-700 ${CHOSEN}`,
    chosenDanger: `border-danger ${CHOSEN_DANGER}`,
    idle: 'border-line bg-surface text-ink hover:bg-surface-muted',
  },
  segments: {
    group: 'grid auto-cols-fr grid-flow-col gap-0.5 rounded-xl bg-surface-muted p-0.5',
    option: `flex min-h-11 min-w-0 items-center justify-center rounded-[0.625rem] px-1 text-center text-[0.8125rem] leading-tight hyphens-calm ${FOCUS}`,
    chosen: CHOSEN,
    chosenDanger: CHOSEN_DANGER,
    idle: 'text-ink hover:bg-surface',
  },
} as const;

/**
 * A single choice shown as chips (portions, reasons, outcomes). Native radio buttons underneath:
 * arrow keys, screen readers and form semantics work without extra code.
 */
export function ChoiceChips<TValue extends string>({
  legend,
  options,
  value,
  onChange,
  hideLegend = false,
  segmented = false,
}: ChoiceChipsProps<TValue>) {
  const name = useId();
  const look = LOOKS[segmented ? 'segments' : 'chips'];
  return (
    <fieldset className="space-y-2">
      <legend className={hideLegend ? 'sr-only' : 'mb-2 font-semibold'}>{legend}</legend>
      <div className={look.group}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`${look.option} ${
                checked ? (option.danger === true ? look.chosenDanger : look.chosen) : look.idle
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => {
                  onChange(option.value);
                }}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
