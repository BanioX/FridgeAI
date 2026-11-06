import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysBetween,
  formatSwissDate,
  localDate,
  minLocalDate,
  parseDateInput,
  toLocalDate,
} from '../src/dates';

describe('toLocalDate', () => {
  it.each([
    ['2026-11-06T22:59:59Z', '2026-11-06'], // 23:59 CET
    ['2026-11-06T23:00:00Z', '2026-11-07'], // midnight CET → next day
    ['2026-07-01T21:59:00Z', '2026-07-01'], // 23:59 CEST
    ['2026-07-01T22:00:00Z', '2026-07-02'], // midnight CEST
    ['2026-03-29T00:30:00Z', '2026-03-29'], // DST switch night
    ['2026-12-31T23:30:00Z', '2027-01-01'], // new year in Zurich
  ])('maps %s to the Swiss calendar day %s', (instant, expected) => {
    expect(toLocalDate(instant)).toBe(expected);
  });

  it('accepts Date objects, timestamps and other time zones', () => {
    expect(toLocalDate(new Date('2026-11-06T12:00:00Z'))).toBe('2026-11-06');
    expect(toLocalDate(Date.UTC(2026, 10, 6, 23, 30))).toBe('2026-11-07');
    expect(toLocalDate('2026-11-06T23:30:00Z', 'America/New_York')).toBe('2026-11-06');
  });

  it('rejects invalid instants', () => {
    expect(() => toLocalDate('not a date')).toThrow(RangeError);
  });
});

describe('calendar arithmetic', () => {
  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDays(localDate('2026-11-28'), 3)).toBe('2026-12-01');
    expect(addDays(localDate('2026-12-31'), 1)).toBe('2027-01-01');
    expect(addDays(localDate('2028-02-28'), 1)).toBe('2028-02-29');
    expect(addDays(localDate('2026-03-01'), -1)).toBe('2026-02-28');
    expect(() => addDays(localDate('2026-03-01'), 0.5)).toThrow(RangeError);
  });

  it('is unaffected by daylight saving time', () => {
    expect(daysBetween(localDate('2026-03-28'), localDate('2026-03-30'))).toBe(2);
    expect(daysBetween(localDate('2026-10-24'), localDate('2026-10-26'))).toBe(2);
  });

  it('round-trips addDays and daysBetween', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20_000, max: 20_000 }), (days) => {
        const start = localDate('2026-11-06');
        expect(daysBetween(start, addDays(start, days))).toBe(days);
      }),
    );
  });

  it('rejects impossible calendar days and picks the earlier date', () => {
    expect(() => localDate('2026-02-30')).toThrow();
    expect(minLocalDate(localDate('2026-11-06'), localDate('2026-11-05'))).toBe('2026-11-05');
    expect(minLocalDate(localDate('2026-11-05'), localDate('2026-11-06'))).toBe('2026-11-05');
  });
});

describe('parseDateInput', () => {
  const today = localDate('2026-11-06');

  it.each([
    ['06.11.2026', '2026-11-06'],
    ['6.11.2026', '2026-11-06'],
    ['6.11.26', '2026-11-06'],
    ['06:11:2026', '2026-11-06'],
    ['6/11/2026', '2026-11-06'],
    ['6-11-2026', '2026-11-06'],
    ['6 11 2026', '2026-11-06'],
    ['061126', '2026-11-06'],
    ['06112026', '2026-11-06'],
    ['2026-11-06', '2026-11-06'],
    ['  24.12.2026 ', '2026-12-24'],
    ['29.02.2028', '2028-02-29'],
  ])('reads %j as %s', (input, expected) => {
    expect(parseDateInput(input, today)).toBe(expected);
  });

  it.each([
    ['24.12.', '2026-12-24'],
    ['24.12', '2026-12-24'],
    ['4.11.', '2026-11-04'], // just expired: stays this year
    ['15.1.', '2027-01-15'], // long past this year: next January
  ])('completes %j without a year to %s', (input, expected) => {
    expect(parseDateInput(input, today)).toBe(expected);
  });

  it.each([
    ['11.2026', '2026-11-30'],
    ['02.2028', '2028-02-29'],
    ['11/26', '2026-11-30'],
  ])('reads month/year %j as the end of the month %s', (input, expected) => {
    expect(parseDateInput(input, today)).toBe(expected);
  });

  it.each([
    '',
    'morgen',
    '31.02.2026',
    '32.1.2026',
    '1.13.2026',
    '6.11.202',
    '6.11.2026.1',
    '13.2026',
    'ab.cd',
  ])('rejects %j', (input) => {
    expect(parseDateInput(input, today)).toBeNull();
  });

  it('formats dates the Swiss way and round-trips', () => {
    expect(formatSwissDate(localDate('2026-11-06'))).toBe('06.11.2026');
    expect(parseDateInput(formatSwissDate(localDate('2027-03-01')), today)).toBe('2027-03-01');
  });
});
