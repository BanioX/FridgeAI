import { describe, expect, it } from 'vitest';
import { frequentProducts, type Addition } from '../src/frequent-products';
import { IdSchema } from '../src/ids';

const id = (n: number) => IdSchema.parse(`01890000-0000-7000-8000-${String(n).padStart(12, '0')}`);
const milk = id(1);
const bread = id(2);
const eggs = id(3);

const added = (
  productId: ReturnType<typeof id>,
  day: number,
  amount: number,
): Addition<number> => ({
  productId,
  addedAt: `2026-11-${String(day).padStart(2, '0')}T08:00:00.000Z`,
  last: amount,
});

describe('frequentProducts (UC-07)', () => {
  it('ranks by how often a product was added and keeps the latest amount', () => {
    const result = frequentProducts(
      [
        added(bread, 1, 1),
        added(milk, 2, 1),
        added(milk, 4, 2),
        added(milk, 3, 1),
        added(eggs, 5, 6),
      ],
      8,
    );
    expect(result).toEqual([
      { productId: milk, timesAdded: 3, last: 2 },
      { productId: eggs, timesAdded: 1, last: 6 },
      { productId: bread, timesAdded: 1, last: 1 },
    ]);
  });

  it('stays stable for equal counts and dates and respects the limit', () => {
    const sameTime = [added(eggs, 1, 1), added(bread, 1, 1), added(milk, 1, 1)];
    expect(frequentProducts(sameTime, 2).map((entry) => entry.productId)).toEqual([milk, bread]);
    expect(frequentProducts(sameTime, 0)).toEqual([]);
    expect(frequentProducts([], 5)).toEqual([]);
    // Added in the same second: the later one is «last time».
    expect(frequentProducts([added(milk, 1, 1), added(milk, 1, 2)], 1)[0]?.last).toBe(2);
  });
});
