import { daysBetween, type LocalDate } from '@fridgeai/core';
import { messages } from '../app/messages.de-CH';

function groupDigits(digits: string): string {
  let text = digits.slice(0, 2);
  if (digits.length > 2) {
    text += `.${digits.slice(2, 4)}`;
  }
  if (digits.length > 4) {
    text += `.${digits.slice(4, 8)}`;
  }
  return text;
}

/**
 * Typing helper for the date field: digits typed without separators get dots automatically
 * (`061126` → `06.11.26`). As soon as someone types a separator themselves (`6.11.`, `11.2026`),
 * the text is left exactly as typed and parsed as is.
 */
export function nextDateText(
  previous: string,
  raw: string,
  autoFormatting: boolean,
): { text: string; autoFormatting: boolean } {
  if (raw === '') {
    return { text: '', autoFormatting: true };
  }
  const appended = raw.length === previous.length + 1 && raw.startsWith(previous);
  const typedChar = appended ? raw.slice(-1) : '';
  if (appended && !/\d/.test(typedChar)) {
    return { text: raw, autoFormatting: false };
  }
  if (autoFormatting && /^[\d.]*$/.test(raw)) {
    return { text: groupDigits(raw.replace(/\./g, '')), autoFormatting: true };
  }
  return { text: raw, autoFormatting: /^\d*$/.test(raw) };
}

const longDate = new Intl.DateTimeFormat('de-CH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** «Fr., 6. Nov. 2026» */
export function describeDate(date: LocalDate): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return longDate.format(new Date(Date.UTC(year, month - 1, day)));
}

/** «heute», «morgen», «in 3 Tagen», «in 6 Monaten», «in 25 Jahren», «vor 2 Tagen». */
export function describeRelative(date: LocalDate, today: LocalDate): string {
  const days = daysBetween(today, date);
  const t = messages.dateField.relative;
  if (days === 0) return t.today;
  if (days === 1) return t.tomorrow;
  if (days === -1) return t.yesterday;
  const abs = Math.abs(days);
  let amount: string;
  if (abs < 14) {
    amount = t.days(abs);
  } else if (abs < 61) {
    amount = t.weeks(Math.round(abs / 7));
  } else if (abs < 730) {
    amount = t.months(Math.round(abs / 30.44));
  } else {
    amount = t.years(Math.round(abs / 365.25));
  }
  return days > 0 ? t.future(amount) : t.past(amount);
}
