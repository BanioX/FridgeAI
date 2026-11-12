import { describe, expect, it } from 'vitest';
import { swipePortion } from './swipe-portion';

describe('swipePortion', () => {
  it('eats one piece of several', () => {
    expect(swipePortion({ quantity: 6, unit: 'pcs' })).toEqual({ kind: 'piece', quantity: 1 });
    expect(swipePortion({ quantity: 1, unit: 'pcs' })).toEqual({ kind: 'piece', quantity: 1 });
    expect(swipePortion({ quantity: 1.5, unit: 'pcs' })).toEqual({ kind: 'piece', quantity: 1 });
  });

  it('eats the rest when less than one piece is left', () => {
    expect(swipePortion({ quantity: 0.75, unit: 'pcs' })).toEqual({ kind: 'rest', quantity: 0.75 });
  });

  it('eats one portion of grams or millilitres when the size is known', () => {
    expect(swipePortion({ quantity: 500, unit: 'g' }, 125)).toEqual({
      kind: 'portion',
      quantity: 125,
    });
    expect(swipePortion({ quantity: 1000, unit: 'ml' }, 200)).toEqual({
      kind: 'portion',
      quantity: 200,
    });
  });

  it('eats the rest without a portion size, or when the portion is not smaller', () => {
    expect(swipePortion({ quantity: 500, unit: 'g' })).toEqual({ kind: 'rest', quantity: 500 });
    expect(swipePortion({ quantity: 100, unit: 'g' }, 125)).toEqual({
      kind: 'rest',
      quantity: 100,
    });
    expect(swipePortion({ quantity: 100, unit: 'g' }, 100)).toEqual({
      kind: 'rest',
      quantity: 100,
    });
    expect(swipePortion({ quantity: 100, unit: 'g' }, 0)).toEqual({ kind: 'rest', quantity: 100 });
  });

  it('takes a whole pack, or the rest of the opened one, when the item is counted in packs', () => {
    // ADR-0066: a swipe on Schmelzkäse means the pack, not one slice.
    expect(swipePortion({ quantity: 10, unit: 'pcs', piecesPerPack: 10 })).toEqual({
      kind: 'pack',
      quantity: 10,
    });
    expect(swipePortion({ quantity: 17, unit: 'pcs', piecesPerPack: 10 })).toEqual({
      kind: 'packRest',
      quantity: 7,
    });
    expect(swipePortion({ quantity: 2.5, unit: 'pcs', piecesPerPack: 6 })).toEqual({
      kind: 'packRest',
      quantity: 2.5,
    });
  });
});
