import { describe, expect, it } from 'vitest';
import {
  categoryById,
  currentPack,
  packContent,
  packTake,
  piecesPerPackFor,
  portioningOf,
} from '../src';

function fail(id: string): never {
  throw new Error(`no category ${id}`);
}

const slices = { packs: [10, 8, 12], sharedPack: true };

describe('piecesPerPackFor (ADR-0066)', () => {
  it('finds the pack size an amount stands for', () => {
    expect(piecesPerPackFor(10, slices)).toBe(10);
    expect(piecesPerPackFor(20, slices)).toBe(10);
    expect(piecesPerPackFor(16, slices)).toBe(8);
  });

  it('has none for one piece or an amount no pack fits', () => {
    expect(piecesPerPackFor(1, slices)).toBeUndefined();
    expect(piecesPerPackFor(7, slices)).toBeUndefined();
    expect(piecesPerPackFor(9.5, slices)).toBeUndefined();
  });

  it('has none where every piece stands for itself: four yoghurts are four cups', () => {
    expect(piecesPerPackFor(4, { packs: [4] })).toBeUndefined();
    expect(piecesPerPackFor(6, { packs: [6, 10] })).toBeUndefined();
    expect(piecesPerPackFor(10, {})).toBeUndefined();
  });

  it('counts cheese slices in packs, eggs and yoghurt in pieces', () => {
    const portioning = (id: string) => portioningOf(categoryById(id) ?? fail(id));
    expect(piecesPerPackFor(10, portioning('dairy-cheese-slices'))).toBe(10);
    expect(piecesPerPackFor(6, portioning('dairy-eggs'))).toBeUndefined();
    expect(piecesPerPackFor(4, portioning('dairy-yoghurt'))).toBeUndefined();
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

describe('currentPack', () => {
  it('shows the opened pack and counts the whole ones behind it', () => {
    expect(currentPack({ quantity: 17, unit: 'pcs', piecesPerPack: 10 })).toEqual({
      pack: { start: 10, left: 7 },
      behind: 1,
    });
  });

  it('shows the next whole pack when none is opened', () => {
    expect(currentPack({ quantity: 20, unit: 'pcs', piecesPerPack: 10 })).toEqual({
      pack: { start: 10, left: 10 },
      behind: 1,
    });
    expect(currentPack({ quantity: 10, unit: 'pcs', piecesPerPack: 10 })).toEqual({
      pack: { start: 10, left: 10 },
      behind: 0,
    });
  });

  it('falls back to everything that came home where pieces stand for themselves', () => {
    expect(currentPack({ quantity: 4, unit: 'pcs', takenQuantity: 2 })).toEqual({
      pack: { start: 6, left: 4 },
      behind: 0,
    });
    expect(currentPack({ quantity: 1, unit: 'pcs' })).toBeUndefined();
    expect(currentPack({ quantity: 300, unit: 'g' })).toBeUndefined();
  });
});
