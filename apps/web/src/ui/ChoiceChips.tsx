import { useId } from 'react';

interface ChoiceChipsProps<TValue extends string> {
  legend: string;
  options: readonly { value: TValue; label: string }[];
  /** `null`: nothing chosen yet. */
  value: TValue | null;
  onChange: (value: TValue) => void;
  /** Visually hide the legend when a heading above already says the same. */
  hideLegend?: boolean;
}

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
}: ChoiceChipsProps<TValue>) {
  const name = useId();
  return (
    <fieldset className="space-y-2">
      <legend className={hideLegend ? 'sr-only' : 'mb-2 font-semibold'}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-basil-600 ${
                checked
                  ? 'border-basil-700 bg-basil-700 text-white'
                  : 'border-line bg-surface text-ink hover:bg-surface-muted'
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
