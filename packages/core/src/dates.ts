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

export function minLocalDate(a: LocalDate, b: LocalDate): LocalDate {
  return a <= b ? a : b;
}
