import { parseDateInput, type LocalDate } from '@fridgeai/core';
import { CalendarDays } from 'lucide-react';
import { messages } from '../app/messages.de-CH';

/**
 * Desktop browsers open the picker only through `showPicker()`. On iPhone the tap itself reaches
 * the (invisible) native date field, which opens the date wheel; `showPicker()` is then not
 * needed and may throw.
 */
function openPicker(input: HTMLInputElement) {
  try {
    input.showPicker();
  } catch {
    // Already open, or not supported: the native tap handling takes over.
  }
}

/**
 * The calendar symbol next to a date typed as TT.MM.JJJJ. The device's own date field lies
 * invisibly on top: iOS opens its date wheel only for a tap on the field itself. The text next to
 * it always shows the Swiss format, whatever language the device speaks (Alban, 8.11.2026).
 */
export function CalendarButton({
  value,
  onPick,
  today,
  max = '2126-12-31',
  label = messages.dateField.openCalendar,
}: {
  value: LocalDate | null;
  onPick: (date: LocalDate) => void;
  today: LocalDate;
  max?: string;
  label?: string;
}) {
  return (
    <div className="relative flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-line bg-surface text-basil-700 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-basil-600 hover:bg-surface-muted">
      <CalendarDays size={22} aria-hidden="true" />
      <input
        type="date"
        aria-label={label}
        value={value ?? ''}
        max={max}
        onClick={(event) => {
          openPicker(event.currentTarget);
        }}
        onChange={(event) => {
          const date = parseDateInput(event.target.value, today);
          if (date !== null) {
            onPick(date);
          }
        }}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none text-base opacity-0"
      />
    </div>
  );
}
