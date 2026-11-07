import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { isAtRisk, startOfMonth, summarizeImpact } from '../src/metrics';
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
  atRisk?: boolean;
}
const outcome = ({
  at,
  deletedAt,
  valueRappen = 100,
  grams,
  atRisk = true,
  ...rest
}: OutcomeInput): Outcome => ({
  valueEstimated: false,
  atRisk,
  ...rest,
  at: IsoDateTimeSchema.parse(at),
  valueRappen: rappen(valueRappen),
  ...(grams === undefined ? {} : { grams }),
  ...(deletedAt === undefined ? {} : { deletedAt: IsoDateTimeSchema.parse(deletedAt) }),
});

const from = localDate('2026-11-01');
const to = localDate('2026-11-30');

describe('summarizeImpact', () => {
  it('counts eaten and shared at risk as rescued, wasted separately, in CHF, grams and count', () => {
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
        // Eaten while still fresh, or an entry from before the rule: consumption, no rescue.
        outcome({ outcome: 'eaten', at: '2026-11-06T12:00:00.000Z', atRisk: false }),
        { ...outcome({ outcome: 'eaten', at: '2026-11-06T12:00:00.000Z' }), atRisk: undefined },
      ],
      from,
      to,
    );
    expect(summary).toEqual({
      savedRappen: 600,
      wastedRappen: 150,
      savedGrams: 500,
      wastedGrams: 100,
      savedCount: 2,
      wastedCount: 1,
      estimated: true,
      savedShare: 0.8,
    });
  });

  it('calls food at risk within the soon days or past best-before, not past use-by', () => {
    const today = localDate('2026-11-07');
    expect(isAtRisk(localDate('2026-11-10'), 'best_before', today, 3)).toBe(true);
    expect(isAtRisk(localDate('2026-11-11'), 'best_before', today, 3)).toBe(false);
    expect(isAtRisk(localDate('2026-11-07'), 'use_by', today, 3)).toBe(true);
    expect(isAtRisk(localDate('2026-11-01'), 'best_before', today, 3)).toBe(true);
    expect(isAtRisk(localDate('2026-11-06'), 'use_by', today, 3)).toBe(false);
    expect(isAtRisk(localDate('2027-01-31'), 'best_before', today, 90)).toBe(true);
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
    expect(
      summarizeImpact(
        [outcome({ outcome: 'eaten', at: '2026-11-03T12:00:00.000Z', atRisk: false })],
        from,
        to,
      ).savedShare,
    ).toBeNull();
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
