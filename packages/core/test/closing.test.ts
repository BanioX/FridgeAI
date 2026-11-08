import { describe, expect, it } from 'vitest';
import {
  closingMonth,
  closingMonthOf,
  closingYear,
  easterSunday,
  isSwissBankDay,
  localDate,
  monthClosingDay,
  swissBankHolidays,
} from '../src';

describe('Swiss bank days (SIC)', () => {
  it('finds Easter', () => {
    expect(easterSunday(2024)).toBe('2024-03-31');
    expect(easterSunday(2025)).toBe('2025-04-20');
    expect(easterSunday(2026)).toBe('2026-04-05');
    expect(easterSunday(2027)).toBe('2027-03-28');
  });

  it('lists the bank holidays of 2026', () => {
    expect(swissBankHolidays(2026)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-04-03',
      '2026-04-06',
      '2026-05-01',
      '2026-05-14',
      '2026-05-25',
      '2026-08-01',
      '2026-12-25',
      '2026-12-26',
    ]);
  });

  it('counts 24.12. and 31.12. as bank days, weekends never', () => {
    expect(isSwissBankDay(localDate('2026-12-24'))).toBe(true);
    expect(isSwissBankDay(localDate('2026-12-31'))).toBe(true);
    expect(isSwissBankDay(localDate('2026-10-31'))).toBe(false);
    expect(isSwissBankDay(localDate('2026-04-03'))).toBe(false);
  });
});

describe('closings', () => {
  it('closes a month on its last bank day', () => {
    // Saturday 31.10.2026 → Friday.
    expect(monthClosingDay(2026, 10)).toBe('2026-10-30');
    expect(monthClosingDay(2026, 11)).toBe('2026-11-30');
    expect(monthClosingDay(2026, 12)).toBe('2026-12-31');
    // Easter 2024: Sunday 31.3., Good Friday 29.3. → Thursday 28.3.
    expect(monthClosingDay(2024, 3)).toBe('2024-03-28');
  });

  it('starts a month the day after the last closing, so no day is lost', () => {
    expect(closingMonth(2026, 11)).toEqual({ from: '2026-10-31', to: '2026-11-30' });
    expect(closingMonth(2026, 1)).toEqual({ from: '2026-01-01', to: '2026-01-30' });
    expect(closingMonth(2027, 1)).toEqual({ from: '2027-01-01', to: '2027-01-29' });
    expect(closingYear(2026)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
    // 31.12.2027 is a Friday; 2028 starts on 1.1.
    expect(closingYear(2028).from).toBe('2028-01-01');
  });

  it('knows which month a day belongs to', () => {
    expect(closingMonthOf(localDate('2026-10-30'))).toEqual({ year: 2026, month: 10 });
    expect(closingMonthOf(localDate('2026-10-31'))).toEqual({ year: 2026, month: 11 });
    expect(closingMonthOf(localDate('2025-12-31'))).toEqual({ year: 2025, month: 12 });
    // Every day of a long stretch lies in exactly the month that claims it.
    let date = localDate('2025-12-01');
    for (let index = 0; index < 800; index += 1) {
      const { year, month } = closingMonthOf(date);
      const period = closingMonth(year, month);
      expect(date >= period.from && date <= period.to).toBe(true);
      date = localDate(
        new Date(Date.parse(`${date}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10),
      );
    }
  });
});
