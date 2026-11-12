import { describe, expect, it } from 'vitest';
import { packLeft } from '../src';

describe('packLeft', () => {
  it('counts the start of a pack from what is left and what already went', () => {
    expect(packLeft({ quantity: 7, unit: 'pcs', takenQuantity: 3 })).toEqual({
      start: 10,
      left: 7,
    });
    // Untouched: the whole pack.
    expect(packLeft({ quantity: 10, unit: 'pcs' })).toEqual({ start: 10, left: 10 });
  });

  it('keeps halves and rounds away float noise', () => {
    expect(packLeft({ quantity: 9.5, unit: 'pcs', takenQuantity: 0.5 })).toEqual({
      start: 10,
      left: 9.5,
    });
    expect(packLeft({ quantity: 0.7, unit: 'pcs', takenQuantity: 0.1 + 0.2 + 1 })).toEqual({
      start: 2,
      left: 0.7,
    });
  });

  it('has none for a single piece or for grams and millilitres', () => {
    expect(packLeft({ quantity: 1, unit: 'pcs' })).toBeUndefined();
    expect(packLeft({ quantity: 0.5, unit: 'pcs', takenQuantity: 0.5 })).toBeUndefined();
    expect(packLeft({ quantity: 250, unit: 'g', takenQuantity: 250 })).toBeUndefined();
    expect(packLeft({ quantity: 500, unit: 'ml' })).toBeUndefined();
  });
});
