import { addDays, localDate } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import {
  chosenPeriod,
  initialPeriod,
  monthOptions,
  rangeOption,
  yearOptions,
} from './report-period';

const today = localDate('2026-11-08');

describe('report periods like a bank statement', () => {
  it('offers the running month first, then the closed months', () => {
    const [running, october] = monthOptions(today);
    expect(running).toEqual({
      value: '2026-11',
      period: { from: '2026-10-31', to: '2026-11-08' },
      label: 'November 2026 · bis heute',
    });
    // Saturday 31.10. belongs to November: October closes on Friday.
    expect(october).toEqual({
      value: '2026-10',
      period: { from: '2026-10-01', to: '2026-10-30' },
      label: 'Oktober 2026 · per 30.10.2026',
    });
  });

  it('chains the months without a gap or an overlap', () => {
    const options = monthOptions(today);
    expect(options).toHaveLength(24);
    options.slice(1).forEach((older, index) => {
      expect(addDays(older.period.to, 1)).toBe(options[index]?.period.from);
    });
  });

  it('counts a weekend after the closing towards the next month', () => {
    const saturday = localDate('2026-10-31');
    expect(monthOptions(saturday, 2).map((option) => option.label)).toEqual([
      'November 2026 · bis heute',
      'Oktober 2026 · per 30.10.2026',
    ]);
  });

  it('offers the running year and two closed ones', () => {
    expect(yearOptions(today).map((option) => [option.label, option.period])).toEqual([
      ['Jahr 2026 · bis heute', { from: '2026-01-01', to: '2026-11-08' }],
      ['Jahr 2025 · per 31.12.2025', { from: '2025-01-01', to: '2025-12-31' }],
      // 2023 closed on Friday 29.12., so the weekend after it belongs to 2024.
      ['Jahr 2024 · per 31.12.2024', { from: '2023-12-30', to: '2024-12-31' }],
    ]);
  });

  it('takes any range up to today, never backwards or into the future', () => {
    expect(rangeOption(localDate('2026-01-15'), localDate('2026-03-31'), today)?.label).toBe(
      '15.01.2026 – 31.03.2026',
    );
    expect(rangeOption(localDate('2026-03-31'), localDate('2026-01-15'), today)).toBeNull();
    expect(rangeOption(localDate('2026-11-01'), localDate('2026-11-09'), today)).toBeNull();
    expect(rangeOption(null, today, today)).toBeNull();
  });

  it('starts with the running month, and as a range with the same days', () => {
    const state = initialPeriod(today);
    expect(chosenPeriod(state, today)?.label).toBe('November 2026 · bis heute');
    expect(chosenPeriod({ ...state, mode: 'range' }, today)?.label).toBe('31.10.2026 – 08.11.2026');
    expect(chosenPeriod({ ...state, mode: 'range', from: '' }, today)).toBeNull();
    // Typed the Swiss way, whatever language the device speaks.
    expect(state.from).toBe('31.10.2026');
    expect(
      chosenPeriod({ ...state, mode: 'range', from: '1.1.2026', to: '31.03.2026' }, today)?.period,
    ).toEqual({ from: '2026-01-01', to: '2026-03-31' });
    expect(chosenPeriod({ ...state, mode: 'year', year: '2025' }, today)?.period.to).toBe(
      '2025-12-31',
    );
  });
});
