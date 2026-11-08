/** Several receipts on one review page (Alban, 8.11.2026): order, totals and duplicates. */

interface WithSum {
  review: { receipt: { sumCheck: 'ok' | 'mismatch' | 'no-total' } };
}

/** Receipts that need a look (sum off or no total) first, the rest after; otherwise in reading order. */
export function orderBySumCheck<T extends WithSum>(sections: readonly T[]): T[] {
  const needsLook = (section: T) => section.review.receipt.sumCheck !== 'ok';
  return [...sections.filter(needsLook), ...sections.filter((section) => !needsLook(section))];
}

/** What «Alle übernehmen» will import: ticked articles and receipts, left-out receipts not counted. */
export function batchTotals(
  sections: readonly { excluded: boolean; chosen: ReadonlySet<number> }[],
): {
  articles: number;
  receipts: number;
} {
  const taken = sections.filter((section) => !section.excluded && section.chosen.size > 0);
  return {
    articles: taken.reduce((sum, section) => sum + section.chosen.size, 0),
    receipts: taken.length,
  };
}

/** True when this hash was already read in the same batch (the same file chosen twice). */
export const seenInBatch = (hash: string, earlier: readonly { hash: string }[]) =>
  earlier.some((other) => other.hash === hash);
