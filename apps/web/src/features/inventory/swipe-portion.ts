import { packContent, packTake, type Unit } from '@fridgeai/core';

/** What one swipe eats: a piece, a portion of an amount, or whatever is left. */
export interface SwipePortion {
  kind: 'piece' | 'pack' | 'packRest' | 'portion' | 'rest';
  /** In the item's own unit. */
  quantity: number;
}

const EPSILON = 1e-9;

/**
 * What «eins verwertet» means for one item (swipe on the Vorrat list):
 * - pieces in packs (ADR-0066): one pack, or the rest of the opened pack;
 * - pieces: 1, or the rest if less than one is left;
 * - grams and millilitres: one portion if a portion size is known and smaller than what is left,
 *   otherwise the rest. The catalog has no portion sizes yet, so callers pass none today.
 */
export function swipePortion(
  item: { quantity: number; unit: Unit; piecesPerPack?: number | undefined },
  portionSize?: number,
): SwipePortion {
  const content = item.unit === 'pcs' ? packContent(item) : undefined;
  if (content !== undefined) {
    // Counted in packs (ADR-0066): a swipe takes a whole pack, or the rest of the opened one.
    const take = packTake(content);
    return { kind: take.whole ? 'pack' : 'packRest', quantity: take.quantity };
  }
  if (item.unit === 'pcs') {
    return item.quantity >= 1 - EPSILON
      ? { kind: 'piece', quantity: 1 }
      : { kind: 'rest', quantity: item.quantity };
  }
  if (portionSize !== undefined && portionSize > 0 && portionSize < item.quantity - EPSILON) {
    return { kind: 'portion', quantity: portionSize };
  }
  return { kind: 'rest', quantity: item.quantity };
}
