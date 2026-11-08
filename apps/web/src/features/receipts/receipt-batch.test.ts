import { describe, expect, it } from 'vitest';
import { batchTotals, orderBySumCheck, seenInBatch } from './receipt-batch';

const section = (name: string, sumCheck: 'ok' | 'mismatch' | 'no-total') => ({
  name,
  review: { receipt: { sumCheck } },
});

describe('orderBySumCheck', () => {
  it('puts receipts that need a look first and keeps the reading order otherwise', () => {
    const ordered = orderBySumCheck([
      section('a', 'ok'),
      section('b', 'mismatch'),
      section('c', 'ok'),
      section('d', 'no-total'),
    ]);
    expect(ordered.map((entry) => entry.name)).toEqual(['b', 'd', 'a', 'c']);
  });
});

describe('batchTotals', () => {
  it('counts ticked articles and receipts, without left-out or empty receipts', () => {
    expect(
      batchTotals([
        { excluded: false, chosen: new Set([0, 1, 2]) },
        { excluded: true, chosen: new Set([0, 1]) },
        { excluded: false, chosen: new Set() },
        { excluded: false, chosen: new Set([4]) },
      ]),
    ).toEqual({ articles: 4, receipts: 2 });
  });
});

describe('seenInBatch', () => {
  it('finds the same hash among the earlier receipts', () => {
    expect(seenInBatch('aa', [{ hash: 'bb' }, { hash: 'aa' }])).toBe(true);
    expect(seenInBatch('cc', [{ hash: 'bb' }])).toBe(false);
  });
});
