import { formatSwissDate, parseDateInput, type LocalDate } from '@fridgeai/core';
import { useId, useState } from 'react';
import { messages } from '../../app/messages.de-CH';
import { CalendarButton } from '../../ui/CalendarButton';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { nextDateText } from '../../ui/date-text';
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
  /** Dots are added while typing digits, until the person types their own separator. */
  const [typing, setTyping] = useState({ from: true, to: true });
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
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            {(['from', 'to'] as const).map((field) => (
              <div key={field} className="min-w-0 space-y-2">
                <label htmlFor={`${id}-${field}`} className="block font-semibold">
                  {t[field]}
                </label>
                <div className="flex gap-2">
                  <input
                    id={`${id}-${field}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={messages.dateField.placeholder}
                    value={state[field]}
                    onChange={(event) => {
                      const next = nextDateText(state[field], event.target.value, typing[field]);
                      setTyping({ ...typing, [field]: next.autoFormatting });
                      set({ [field]: next.text });
                    }}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? `${id}-error` : undefined}
                    className={`${FIELD} px-4 text-lg tracking-wide tabular-nums ${invalid ? 'border-today' : 'border-line'}`}
                  />
                  <CalendarButton
                    value={parseDateInput(state[field], today)}
                    onPick={(date) => {
                      set({ [field]: formatSwissDate(date) });
                    }}
                    today={today}
                    max={today}
                    label={t.calendar(t[field])}
                  />
                </div>
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
