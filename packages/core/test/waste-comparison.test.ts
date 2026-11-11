import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { compareWasteSinceFirstMonth } from '../src/metrics';
import { IsoDateTimeSchema } from '../src/model/primitives';
import { rappen } from '../src/money';

type Outcome = Parameters<typeof compareWasteSinceFirstMonth>[0][number];

const wasted = (at: string, value: number, deletedAt?: string): Outcome => ({
  outcome: 'wasted',
  at: IsoDateTimeSchema.parse(at),
  valueRappen: rappen(value),
  valueEstimated: false,
  atRisk: true,
  ...(deletedAt === undefined ? {} : { deletedAt: IsoDateTimeSchema.parse(deletedAt) }),
});
const eaten = (at: string): Outcome => ({
  outcome: 'eaten',
  at: IsoDateTimeSchema.parse(at),
  valueRappen: rappen(300),
  valueEstimated: false,
  atRisk: false,
});

const jan = '2026-01-01T09:00:00.000Z';
const compare = (outcomes: Outcome[], today: string) =>
  compareWasteSinceFirstMonth(outcomes, localDate(today));

describe('compareWasteSinceFirstMonth', () => {
  it('is null without any data', () => {
    expect(compare([], '2026-11-11')).toBeNull();
  });

  it('is null with one completed month only', () => {
    expect(compare([wasted('2026-10-01T10:00:00Z', 2010)], '2026-11-11')).toBeNull();
  });

  it('is null in the second month: no month-to-date comparison', () => {
    const outcomes = [wasted(jan, 2010), wasted('2026-02-10T10:00:00Z', 500)];
    expect(compare(outcomes, '2026-02-20')).toBeNull();
  });

  it('is null if the first month had nothing entsorgt', () => {
    const outcomes = [eaten(jan), wasted('2026-03-10T10:00:00Z', 500)];
    expect(compare(outcomes, '2026-04-15')).toBeNull();
  });

  it('shows an improvement, rounded to whole percent', () => {
    const outcomes = [wasted(jan, 2010), wasted('2026-03-10T10:00:00Z', 1240)];
    expect(compare(outcomes, '2026-04-02')).toEqual({
      firstMonth: '2026-01-01',
      lastMonth: '2026-03-01',
      firstWastedRappen: 2010,
      lastWastedRappen: 1240,
      changePercent: -38,
    });
  });

  it('shows a worsening as a positive percent', () => {
    const outcomes = [wasted(jan, 1000), wasted('2026-03-10T10:00:00Z', 1120)];
    expect(compare(outcomes, '2026-04-02')?.changePercent).toBe(12);
  });

  it('counts a day by its Swiss calendar day', () => {
    // 21:30 UTC on 31 March is 1 April in Zurich (summer time): not part of March.
    const outcomes = [wasted(jan, 1000), wasted('2026-03-31T21:30:00Z', 1120)];
    expect(compare(outcomes, '2026-04-30')).toMatchObject({
      lastWastedRappen: 1120,
      lastMonth: '2026-03-01',
    });
    const cutoff = [wasted(jan, 1000), wasted('2026-02-10T10:00:00Z', 1)];
    expect(compare(cutoff, '2026-04-30')).toMatchObject({ lastMonth: '2026-03-01' });
  });

  it('rounds half away from zero in both directions', () => {
    expect(
      compare([wasted(jan, 200), wasted('2026-03-10T10:00:00Z', 125)], '2026-04-02')?.changePercent,
    ).toBe(-38);
    expect(
      compare([wasted(jan, 200), wasted('2026-03-10T10:00:00Z', 275)], '2026-04-02')?.changePercent,
    ).toBe(38);
  });

  it('reports no change as 0, never -0', () => {
    const outcomes = [wasted(jan, 500), wasted('2026-03-10T10:00:00Z', 500)];
    expect(Object.is(compare(outcomes, '2026-04-02')?.changePercent, 0)).toBe(true);
  });

  it('is 100 % less when the last month had nothing entsorgt', () => {
    const outcomes = [wasted(jan, 500), eaten('2026-03-10T10:00:00Z')];
    expect(compare(outcomes, '2026-04-02')).toMatchObject({
      lastWastedRappen: 0,
      changePercent: -100,
    });
  });

  it('starts at the first full month when use began mid-month', () => {
    const outcomes = [
      wasted('2026-01-15T10:00:00Z', 9999),
      wasted('2026-02-10T10:00:00Z', 400),
      wasted('2026-04-10T10:00:00Z', 300),
    ];
    expect(compare(outcomes, '2026-05-02')).toMatchObject({
      firstMonth: '2026-02-01',
      lastMonth: '2026-04-01',
      changePercent: -25,
    });
  });

  it('ignores undone outcomes', () => {
    const outcomes = [
      wasted('2025-12-05T10:00:00Z', 9000, '2025-12-06T10:00:00Z'),
      wasted(jan, 1000),
      wasted('2026-03-10T10:00:00Z', 500),
    ];
    expect(compare(outcomes, '2026-04-02')).toMatchObject({
      firstMonth: '2026-01-01',
      changePercent: -50,
    });
  });

  it('works across a year boundary', () => {
    const outcomes = [wasted('2025-11-01T10:00:00Z', 800), wasted('2026-01-10T10:00:00Z', 400)];
    expect(compare(outcomes, '2026-02-03')).toMatchObject({
      firstMonth: '2025-11-01',
      lastMonth: '2026-01-01',
      changePercent: -50,
    });
  });
});
