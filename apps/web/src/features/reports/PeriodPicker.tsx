import type { LocalDate } from '@fridgeai/core';
import { useId } from 'react';
import { messages } from '../../app/messages.de-CH';
import { ChoiceChips } from '../../ui/ChoiceChips';
import {
  chosenPeriod,
  monthOptions,
  yearOptions,
  type PeriodMode,
  type PeriodState,
} from './report-period';

const t = messages.reports;
const modeOptions = (Object.keys(t.periodModes) as PeriodMode[]).map((value) => ({
  value,
  label: t.periodModes[value],
}));
const FIELD =
  'min-h-12 w-full min-w-0 rounded-xl border bg-surface outline-none focus:border-basil-600';

/**
 * The period of a report like a bank statement (ADR-0030): a month or a year closing on the last
 * Swiss bank day, or any range from one day to another.
 */
export function PeriodPicker({
  state,
  onChange,
  today,
}: {
  state: PeriodState;
  onChange: (state: PeriodState) => void;
  today: LocalDate;
}) {
  const id = useId();
  const invalid = state.mode === 'range' && chosenPeriod(state, today) === null;
  const set = (patch: Partial<PeriodState>) => {
    onChange({ ...state, ...patch });
  };

  return (
    <div className="space-y-3">
      <ChoiceChips
        legend={t.periodLegend}
        options={modeOptions}
        value={state.mode}
        onChange={(mode) => {
          set({ mode });
        }}
        segmented
      />
      {state.mode === 'month' || state.mode === 'year' ? (
        <div className="space-y-2">
          <label htmlFor={`${id}-closing`} className="font-semibold">
            {state.mode === 'month' ? t.monthLabel : t.yearLabel}
          </label>
          <select
            id={`${id}-closing`}
            value={state.mode === 'month' ? state.month : state.year}
            onChange={(event) => {
              set(
                state.mode === 'month'
                  ? { month: event.target.value }
                  : { year: event.target.value },
              );
            }}
            aria-describedby={`${id}-hint`}
            className={`${FIELD} border-line px-4 text-lg`}
          >
            {(state.mode === 'month' ? monthOptions(today) : yearOptions(today)).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p id={`${id}-hint`} className="text-sm text-ink-muted">
            {t.closingHint}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            {(['from', 'to'] as const).map((field) => (
              <div key={field} className="min-w-0 space-y-2">
                <label htmlFor={`${id}-${field}`} className="block font-semibold">
                  {t[field]}
                </label>
                <input
                  id={`${id}-${field}`}
                  type="date"
                  value={state[field]}
                  max={today}
                  onChange={(event) => {
                    set({ [field]: event.target.value });
                  }}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? `${id}-error` : undefined}
                  className={`${FIELD} px-3 text-base tabular-nums ${invalid ? 'border-today' : 'border-line'}`}
                />
              </div>
            ))}
          </div>
          {invalid ? (
            <p id={`${id}-error`} className="text-sm font-semibold text-today">
              {t.rangeInvalid}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
