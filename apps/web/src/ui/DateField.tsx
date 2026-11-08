import {
  daysBetween,
  expiryPresets,
  formatSwissDate,
  parseDateInput,
  type LocalDate,
  type StorageLocation,
} from '@fridgeai/core';
import { useId, useState } from 'react';
import { messages } from '../app/messages.de-CH';
import { CalendarButton } from './CalendarButton';
import { describeDate, describeRelative, nextDateText } from './date-text';

const t = messages.dateField;

interface DateFieldProps {
  label: string;
  value: LocalDate | null;
  onChange: (value: LocalDate | null) => void;
  today: LocalDate;
  location: StorageLocation;
  /** Typical shelf life of the category, to pick fitting quick choices. */
  typicalShelfLifeDays?: number | null;
  /** Marks the current value as an estimate (from the category). */
  estimated?: boolean;
}

/**
 * Expiry date input (docs/design.md, «Datumsfeld»): pre-filled suggestion, one-tap quick choices
 * matched to the time horizon (days to 50 years), typing with automatic dots and live preview,
 * and the device's native calendar.
 */
export function DateField({
  label,
  value,
  onChange,
  today,
  location,
  typicalShelfLifeDays = null,
  estimated = false,
}: DateFieldProps) {
  const id = useId();
  const [text, setText] = useState(value === null ? '' : formatSwissDate(value));
  const [autoFormatting, setAutoFormatting] = useState(true);
  const [lastValue, setLastValue] = useState(value);
  /** Once the person picks or types a date, it is no longer an estimate. */
  const [edited, setEdited] = useState(false);

  // Keep the text in sync when the value changes from outside (chip, calendar, new suggestion).
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== null && parseDateInput(text, today) !== value) {
      setText(formatSwissDate(value));
      setAutoFormatting(true);
    }
  }

  const parsed = text.trim() === '' ? null : parseDateInput(text, today);
  const invalid = text.trim() !== '' && parsed === null;
  const presets = expiryPresets(location, today, typicalShelfLifeDays);

  function handleTyping(raw: string) {
    const next = nextDateText(text, raw, autoFormatting);
    setText(next.text);
    setAutoFormatting(next.autoFormatting);
    const date = next.text.trim() === '' ? null : parseDateInput(next.text, today);
    setLastValue(date);
    setEdited(true);
    onChange(date);
  }

  function choose(date: LocalDate) {
    setText(formatSwissDate(date));
    setAutoFormatting(true);
    setLastValue(date);
    setEdited(true);
    onChange(date);
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        {estimated && !edited && parsed !== null ? (
          <span className="text-sm text-ink-muted">{t.estimated}</span>
        ) : null}
      </div>

      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={t.placeholder}
          value={text}
          onChange={(event) => {
            handleTyping(event.target.value);
          }}
          aria-invalid={invalid}
          aria-describedby={`${id}-hint`}
          className={`min-h-12 w-full rounded-xl border bg-surface px-4 text-lg tabular-nums tracking-wide outline-none focus:border-basil-600 ${
            invalid ? 'border-today' : 'border-line'
          }`}
        />
        <CalendarButton value={parsed} onPick={choose} today={today} />
      </div>

      <p
        id={`${id}-hint`}
        aria-live="polite"
        className={`text-sm ${invalid ? 'text-today' : 'text-ink-muted'}`}
      >
        {invalid
          ? t.invalid
          : parsed === null
            ? t.placeholder
            : `${describeDate(parsed)} · ${describeRelative(parsed, today)}`}
        {parsed !== null && daysBetween(today, parsed) < 0 ? ` ${t.expired}` : null}
      </p>

      <div role="group" aria-label={t.presetsLabel} className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const selected = parsed === preset.date;
          return (
            <button
              key={`${preset.unit}-${String(preset.amount)}`}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                choose(preset.date);
              }}
              className={`min-h-10 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                selected
                  ? 'border-basil-700 bg-basil-700 text-white'
                  : 'border-line bg-surface text-ink hover:bg-surface-muted'
              }`}
            >
              {t.presets[preset.unit](preset.amount)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
