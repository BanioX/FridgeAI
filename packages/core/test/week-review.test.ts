import { describe, expect, it } from 'vitest';
import { isWeekReviewDay, localDate, previousWeek, weekdayIndex } from '../src';

describe('week review', () => {
  it('finds the calendar week before, Monday to Sunday, also across a month and a year', () => {
    expect(previousWeek(localDate('2026-11-16'))).toEqual({ from: '2026-11-09', to: '2026-11-15' });
    expect(previousWeek(localDate('2026-11-18'))).toEqual({ from: '2026-11-09', to: '2026-11-15' });
    expect(previousWeek(localDate('2026-11-15'))).toEqual({ from: '2026-11-02', to: '2026-11-08' });
    expect(previousWeek(localDate('2027-01-04'))).toEqual({ from: '2026-12-28', to: '2027-01-03' });
    // Across the change to winter time (25.10.2026).
    expect(previousWeek(localDate('2026-10-26'))).toEqual({ from: '2026-10-19', to: '2026-10-25' });
  });

  it('shows from Monday to Wednesday', () => {
    expect(weekdayIndex(localDate('2026-11-16'))).toBe(0);
    expect(isWeekReviewDay(localDate('2026-11-16'))).toBe(true);
    expect(isWeekReviewDay(localDate('2026-11-18'))).toBe(true);
    expect(isWeekReviewDay(localDate('2026-11-19'))).toBe(false);
    expect(isWeekReviewDay(localDate('2026-11-15'))).toBe(false);
  });
});
