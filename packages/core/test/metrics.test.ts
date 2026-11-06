import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { startOfMonth, summarizeImpact } from '../src/metrics';
import type { OutcomeEvent } from '../src/model/inventory';
import { IsoDateTimeSchema } from '../src/model/primitives';
import { rappen } from '../src/money';

type Outcome = Parameters<typeof summarizeImpact>[0][number];
interface OutcomeInput {
  outcome: OutcomeEvent['outcome'];
  at: string;
  deletedAt?: string;
  valueRappen?: number;
  grams?: number;
  valueEstimated?: boolean;
}
const outcome = ({ at, deletedAt, valueRappen = 100, grams, ...rest }: OutcomeInput): Outcome => ({
  valueEstimated: false,
  ...rest,
  at: IsoDateTimeSchema.parse(at),
  valueRappen: rappen(valueRappen),
  ...(grams === undefined ? {} : { grams }),
  ...(deletedAt === undefined ? {} : { deletedAt: IsoDateTimeSchema.parse(deletedAt) }),
});

const from = localDate('2026-11-01');
const to = localDate('2026-11-30');

describe('summarizeImpact', () => {
  it('counts eaten and shared as saved, wasted separately, in CHF and grams', () => {
    const summary = summarizeImpact(
      [
        outcome({
          outcome: 'eaten',
          at: '2026-11-03T12:00:00.000Z',
          valueRappen: 395,
          grams: 300,
        }),
        outcome({
          outcome: 'shared_out',
          at: '2026-11-04T12:00:00.000Z',
          valueRappen: 205,
          grams: 200,
        }),
        outcome({
          outcome: 'wasted',
          at: '2026-11-05T12:00:00.000Z',
          valueRappen: 150,
          grams: 100,
          valueEstimated: true,
        }),
      ],
      from,
      to,
    );
    expect(summary).toEqual({
      savedRappen: 600,
      wastedRappen: 150,
      savedGrams: 500,
      wastedGrams: 100,
      estimated: true,
      savedShare: 0.8,
    });
  });

  it('uses the Swiss calendar day and ignores undone outcomes', () => {
    const summary = summarizeImpact(
      [
        // 31 Oct 23:30 UTC is already 1 Nov in Zurich.
        outcome({ outcome: 'eaten', at: '2026-10-31T23:30:00.000Z' }),
        // 30 Nov 23:30 UTC is 1 Dec in Zurich.
        outcome({ outcome: 'eaten', at: '2026-11-30T23:30:00.000Z' }),
        outcome({
          outcome: 'wasted',
          at: '2026-11-10T10:00:00.000Z',
          deletedAt: '2026-11-10T10:01:00.000Z',
        }),
      ],
      from,
      to,
    );
    expect(summary.savedRappen).toBe(100);
    expect(summary.wastedRappen).toBe(0);
  });

  it('has no share without outcomes and falls back to counts when nothing has a value', () => {
    expect(summarizeImpact([], from, to).savedShare).toBeNull();
    const counted = summarizeImpact(
      [
        outcome({ outcome: 'eaten', at: '2026-11-03T12:00:00.000Z', valueRappen: 0 }),
        outcome({ outcome: 'wasted', at: '2026-11-03T12:00:00.000Z', valueRappen: 0 }),
      ],
      from,
      to,
    );
    expect(counted.savedShare).toBe(0.5);
  });
});

describe('startOfMonth', () => {
  it('returns the first day of the month', () => {
    expect(startOfMonth(localDate('2026-11-06'))).toBe('2026-11-01');
    expect(startOfMonth(localDate('2027-02-28'))).toBe('2027-02-01');
  });
});
