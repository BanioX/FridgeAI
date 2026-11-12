import { describe, expect, it } from 'vitest';
import { packContent, packTake, piecesPerPackFor } from '../src';

describe('piecesPerPackFor (ADR-0066)', () => {
  it('finds the pack size an amount stands for', () => {
    expect(piecesPerPackFor(10, [10, 8, 12])).toBe(10);
    expect(piecesPerPackFor(20, [10, 8, 12])).toBe(10);
    expect(piecesPerPackFor(16, [10, 8, 12])).toBe(8);
    expect(piecesPerPackFor(12, [6, 10])).toBe(6);
  });

  it('has none without packs, for one piece or an amount no pack fits', () => {
    expect(piecesPerPackFor(10, undefined)).toBeUndefined();
    expect(piecesPerPackFor(1, [6, 10])).toBeUndefined();
    expect(piecesPerPackFor(7, [6, 10])).toBeUndefined();
    expect(piecesPerPackFor(6.5, [6, 10])).toBeUndefined();
  });
});

describe('packContent and packTake', () => {
  it('splits pieces into whole packs and the opened one', () => {
    expect(packContent({ quantity: 17, piecesPerPack: 10 })).toEqual({
      full: 1,
      open: 7,
      perPack: 10,
    });
    expect(packContent({ quantity: 20, piecesPerPack: 10 })).toEqual({
      full: 2,
      open: 0,
      perPack: 10,
    });
    expect(packContent({ quantity: 10 })).toBeUndefined();
  });

  it('takes the opened pack first, else one whole pack', () => {
    expect(packTake({ full: 1, open: 7, perPack: 10 })).toEqual({ quantity: 7, whole: false });
    expect(packTake({ full: 2, open: 0, perPack: 10 })).toEqual({ quantity: 10, whole: true });
  });
});
