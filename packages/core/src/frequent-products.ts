import type { Id } from './ids';

/** One time a product went into the household, with the amount as it was added. */
export interface Addition<TLast> {
  productId: Id;
  /** ISO instant; only the order matters. */
  addedAt: string;
  last: TLast;
}

export interface ProductFrequency<TLast> {
  productId: Id;
  timesAdded: number;
  /** What was added the last time: the quick add (UC-07) starts from it. */
  last: TLast;
}

/**
 * The household's usual products for «Schnell erfassen» (UC-07): most often added first, ties by
 * the most recent addition, then by product id so the order is stable.
 */
export function frequentProducts<TLast>(
  additions: readonly Addition<TLast>[],
  limit: number,
): ProductFrequency<TLast>[] {
  const byProduct = new Map<Id, { timesAdded: number; addedAt: string; last: TLast }>();
  for (const addition of additions) {
    const seen = byProduct.get(addition.productId);
    if (seen === undefined) {
      byProduct.set(addition.productId, {
        timesAdded: 1,
        addedAt: addition.addedAt,
        last: addition.last,
      });
    } else {
      seen.timesAdded += 1;
      // On the same instant the later entry wins: the list comes in the order things were added.
      if (addition.addedAt >= seen.addedAt) {
        seen.addedAt = addition.addedAt;
        seen.last = addition.last;
      }
    }
  }
  return [...byProduct.entries()]
    .sort(
      ([idA, a], [idB, b]) =>
        b.timesAdded - a.timesAdded || b.addedAt.localeCompare(a.addedAt) || idA.localeCompare(idB),
    )
    .slice(0, Math.max(0, limit))
    .map(([productId, { timesAdded, last }]) => ({ productId, timesAdded, last }));
}
