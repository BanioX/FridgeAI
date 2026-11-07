import type { Unit } from '@fridgeai/core';

/** What one swipe eats: a piece, a portion of an amount, or whatever is left. */
export interface SwipePortion {
  kind: 'piece' | 'portion' | 'rest';
  /** In the item's own unit. */
  quantity: number;
}

const EPSILON = 1e-9;

/**
 * What «eins gegessen» means for one item (swipe on the Vorrat list):
 * - pieces: 1, or the rest if less than one is left;
 * - grams and millilitres: one portion if a portion size is known and smaller than what is left,
 *   otherwise the rest. The catalog has no portion sizes yet, so callers pass none today.
 */
export function swipePortion(
  item: { quantity: number; unit: Unit },
  portionSize?: number,
): SwipePortion {
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
