import { LocalDateSchema, type LocalDate } from './model/primitives';

/** All calendar logic in FridgeAI runs in Swiss local time. */
export const HOME_TIME_ZONE = 'Europe/Zurich';

const MS_PER_DAY = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Parses and brands a `YYYY-MM-DD` string; throws on invalid calendar days. */
export function localDate(value: string): LocalDate {
  return LocalDateSchema.parse(value);
}

/** The calendar day of an instant in Swiss local time (or another IANA time zone). */
export function toLocalDate(instant: Date | string | number, timeZone = HOME_TIME_ZONE): LocalDate {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid instant: ${String(instant)}`);
  }
  const parts = formatterFor(timeZone).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';
  return localDate(`${part('year')}-${part('month')}-${part('day')}`);
}

/** Days since 1970-01-01 for a calendar day; pure date arithmetic without time zones. */
function dayNumber(date: LocalDate): number {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

function fromDayNumber(days: number): LocalDate {
  return localDate(new Date(days * MS_PER_DAY).toISOString().slice(0, 10));
}

export function addDays(date: LocalDate, days: number): LocalDate {
  if (!Number.isSafeInteger(days)) {
    throw new RangeError(`days must be an integer, got ${String(days)}`);
  }
  return fromDayNumber(dayNumber(date) + days);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return dayNumber(to) - dayNumber(from);
}

/** Adds calendar months; the day is clamped to the month's end (31.1. + 1 month = 28./29.2.). */
export function addMonths(date: LocalDate, months: number): LocalDate {
  if (!Number.isSafeInteger(months)) {
    throw new RangeError(`months must be an integer, got ${String(months)}`);
  }
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const index = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  return localDate(
    `${String(targetYear).padStart(4, '0')}-${String(targetMonth).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`,
  );
}

export function addYears(date: LocalDate, years: number): LocalDate {
  return addMonths(date, years * 12);
}

export function minLocalDate(a: LocalDate, b: LocalDate): LocalDate {
  return a <= b ? a : b;
}

/** Last day of a month (month 1–12). */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function buildDate(year: number, month: number, day: number): LocalDate | null {
  const text = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = LocalDateSchema.safeParse(text);
  return parsed.success ? parsed.data : null;
}

function fullYear(text: string): number {
  return text.length === 2 ? 2000 + Number(text) : Number(text);
}

/** Without a year, a date more than this many days in the past means next year. */
const PAST_TOLERANCE_DAYS = 60;

/**
 * Parses a date typed by a person or read from a label (manual expiry entry, step 3d).
 *
 * Accepts `06.11.2026`, `6.11.26`, `06:11:2026`, `6/11/2026`, `6-11-2026`, `061126`, `06112026`,
 * ISO `2026-11-06` (from a native date picker), `6.11.` / `6.11` without a year, and month/year
 * like `11.2026` or `11/26` (labels: end of that month). Returns null if it is not a real date.
 */
export function parseDateInput(input: string, today: LocalDate): LocalDate | null {
  const text = input.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (iso) {
    return buildDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const compact = /^(\d{2})(\d{2})(\d{2}|\d{4})$/.exec(text);
  if (compact) {
    return buildDate(fullYear(compact[3] ?? ''), Number(compact[2]), Number(compact[1]));
  }

  const parts = text
    .replace(/[.:/\-\s]+$/, '')
    .split(/[.:/\-\s]+/)
    .filter((part) => part !== '');
  if (parts.some((part) => !/^\d{1,4}$/.test(part))) {
    return null;
  }

  if (parts.length === 3) {
    const [day = '', month = '', year = ''] = parts;
    if (year.length !== 2 && year.length !== 4) {
      return null;
    }
    return buildDate(fullYear(year), Number(month), Number(day));
  }

  if (parts.length === 2) {
    const [first = '', second = ''] = parts;
    const firstNumber = Number(first);
    const secondNumber = Number(second);
    if (second.length <= 2 && secondNumber >= 1 && secondNumber <= 12) {
      // Day and month without a year: this year, or next year if long past.
      const thisYear = Number(today.slice(0, 4));
      const candidate = buildDate(thisYear, secondNumber, firstNumber);
      if (candidate === null) {
        return null;
      }
      return daysBetween(today, candidate) < -PAST_TOLERANCE_DAYS
        ? buildDate(thisYear + 1, secondNumber, firstNumber)
        : candidate;
    }
    if ((second.length === 2 || second.length === 4) && firstNumber >= 1 && firstNumber <= 12) {
      // Month and year only (e.g. «MHD 11.2026»): the end of that month.
      const year = fullYear(second);
      return buildDate(year, firstNumber, lastDayOfMonth(year, firstNumber));
    }
  }

  return null;
}

/** Swiss display format `06.11.2026`. */
export function formatSwissDate(date: LocalDate): string {
  const [year, month, day] = date.split('-');
  return `${day ?? ''}.${month ?? ''}.${year ?? ''}`;
}
