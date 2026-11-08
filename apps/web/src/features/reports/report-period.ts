import {
  closingMonth,
  closingMonthOf,
  closingYear,
  daysBetween,
  formatSwissDate,
  LocalDateSchema,
  type LocalDate,
  type ReportPeriod,
} from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';

const t = messages.reports;

/** How the period is chosen: a month or a year closing, or any range. */
export type PeriodMode = 'month' | 'year' | 'range';

/** A period to pick, with the text that names it in the title and the PDF. */
export interface PeriodOption {
  value: string;
  period: ReportPeriod;
  label: string;
}

/** The end of a period that has not closed yet is today. */
function cut(period: ReportPeriod, today: LocalDate): { period: ReportPeriod; running: boolean } {
  const running = daysBetween(today, period.to) > 0;
  return { period: running ? { ...period, to: today } : period, running };
}

const ending = (period: ReportPeriod, running: boolean) =>
  running ? t.running : t.closedPer(formatSwissDate(period.to));

/**
 * The month closings to choose from, newest first: the running month (until today), then the
 * closed ones. A month closes on its last Swiss bank day (ADR-0030).
 */
export function monthOptions(today: LocalDate, count = 24): PeriodOption[] {
  let { year, month } = closingMonthOf(today);
  const options: PeriodOption[] = [];
  for (let index = 0; index < count; index += 1) {
    const { period, running } = cut(closingMonth(year, month), today);
    const name = `${t.monthNames[month - 1] ?? ''} ${String(year)}`;
    options.push({
      value: `${String(year)}-${String(month).padStart(2, '0')}`,
      period,
      label: `${name} · ${ending(period, running)}`,
    });
    ({ year, month } = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 });
  }
  return options;
}

/** The running year and the closed ones before it, newest first. */
export function yearOptions(today: LocalDate, count = 3): PeriodOption[] {
  const current = closingMonthOf(today).year;
  return Array.from({ length: count }, (_, index) => {
    const year = current - index;
    const { period, running } = cut(closingYear(year), today);
    return {
      value: String(year),
      period,
      label: `${t.yearName(year)} · ${ending(period, running)}`,
    };
  });
}

/** A range typed by hand: «Von» not after «Bis», and «Bis» not after today. */
export function rangeOption(
  from: LocalDate | null,
  to: LocalDate | null,
  today: LocalDate,
): PeriodOption | null {
  if (from === null || to === null || daysBetween(from, to) < 0 || daysBetween(to, today) < 0) {
    return null;
  }
  return {
    value: `${from}/${to}`,
    period: { from, to },
    label: `${formatSwissDate(from)} – ${formatSwissDate(to)}`,
  };
}

/** What the period picker holds; dates as typed in the native date fields («» while empty). */
export interface PeriodState {
  mode: PeriodMode;
  month: string;
  year: string;
  from: string;
  to: string;
}

/** The running month, and as a range the same month until today. */
export function initialPeriod(today: LocalDate): PeriodState {
  const month = monthOptions(today, 1)[0];
  return {
    mode: 'month',
    month: month?.value ?? '',
    year: String(closingMonthOf(today).year),
    from: month?.period.from ?? today,
    to: today,
  };
}

const asDate = (value: string): LocalDate | null => {
  const parsed = LocalDateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

/** The chosen period, or `null` while the range is incomplete or impossible. */
export function chosenPeriod(state: PeriodState, today: LocalDate): PeriodOption | null {
  switch (state.mode) {
    case 'month':
      return monthOptions(today).find((option) => option.value === state.month) ?? null;
    case 'year':
      return yearOptions(today).find((option) => option.value === state.year) ?? null;
    case 'range':
      return rangeOption(asDate(state.from), asDate(state.to), today);
  }
}
