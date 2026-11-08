import { addDays, daysBetween, localDate } from '../dates';
import type { LocalDate } from '../model/primitives';

/**
 * Report periods like a Swiss bank statement (Alban, 8.11.2026): a month closes on its last
 * Swiss bank day, and the next month starts the day after. Every day belongs to exactly one
 * month; a Saturday 31.10. counts towards November. The year closes with December.
 */
export interface ReportPeriod {
  from: LocalDate;
  to: LocalDate;
}

const pad = (value: number) => String(value).padStart(2, '0');
const day = (year: number, month: number, date: number) =>
  localDate(`${String(year)}-${pad(month)}-${pad(date)}`);

/** Easter Sunday in the Gregorian calendar (anonymous algorithm, Meeus/Jones/Butcher). */
export function easterSunday(year: number): LocalDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const date = ((h + l - 7 * m + 114) % 31) + 1;
  return day(year, month, date);
}

/**
 * Bank holidays of Swiss payment traffic (SIX Interbank Clearing, SIC). 24.12. and 31.12. are
 * ordinary bank days there, the cantonal holidays do not count.
 */
export function swissBankHolidays(year: number): LocalDate[] {
  const easter = easterSunday(year);
  return [
    day(year, 1, 1),
    day(year, 1, 2),
    addDays(easter, -2), // Karfreitag
    addDays(easter, 1), // Ostermontag
    day(year, 5, 1),
    addDays(easter, 39), // Auffahrt
    addDays(easter, 50), // Pfingstmontag
    day(year, 8, 1),
    day(year, 12, 25),
    day(year, 12, 26),
  ].sort();
}

/** Monday to Friday and not a Swiss bank holiday. */
export function isSwissBankDay(date: LocalDate): boolean {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (weekday === 0 || weekday === 6) {
    return false;
  }
  return !swissBankHolidays(Number(date.slice(0, 4))).includes(date);
}

/** The last Swiss bank day of a month (`month` 1–12): the closing day of its report. */
export function monthClosingDay(year: number, month: number): LocalDate {
  let date = addDays(month === 12 ? day(year + 1, 1, 1) : day(year, month + 1, 1), -1);
  while (!isSwissBankDay(date)) {
    date = addDays(date, -1);
  }
  return date;
}

const previous = (year: number, month: number) =>
  month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };

/** A month as on a bank statement: from the day after last month's closing to its own. */
export function closingMonth(year: number, month: number): ReportPeriod {
  const before = previous(year, month);
  return {
    from: addDays(monthClosingDay(before.year, before.month), 1),
    to: monthClosingDay(year, month),
  };
}

/** A year: from the day after last December's closing to this December's closing. */
export function closingYear(year: number): ReportPeriod {
  return { from: closingMonth(year, 1).from, to: monthClosingDay(year, 12) };
}

/** The closing month a day belongs to: a day after the closing counts towards the next month. */
export function closingMonthOf(date: LocalDate): { year: number; month: number } {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  if (daysBetween(monthClosingDay(year, month), date) <= 0) {
    return { year, month };
  }
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}
