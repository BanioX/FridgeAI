import { describe, expect, it } from 'vitest';
import { rappen } from '../src/money';
import { estimateFromCategory, itemValue } from '../src/value';

const milk = { avgPriceRappen: rappen(165), avgWeightGrams: 1030 };
const paper = { avgPriceRappen: rappen(890) };

describe('estimateFromCategory', () => {
  it('counts packs for pieces', () => {
    expect(estimateFromCategory(2, 'pcs', milk)).toEqual({ valueRappen: 330, grams: 2060 });
    expect(estimateFromCategory(1, 'pcs', paper)).toEqual({ valueRappen: 890, grams: undefined });
  });

  it('relates grams and millilitres to the typical pack', () => {
    expect(estimateFromCategory(515, 'ml', milk)).toEqual({ valueRappen: 83, grams: 515 });
    expect(estimateFromCategory(500, 'g', paper)).toEqual({ valueRappen: 890, grams: 500 });
    expect(estimateFromCategory(1, 'pcs', {})).toEqual({ valueRappen: 0, grams: undefined });
  });
});

describe('itemValue', () => {
  it('prefers the receipt price and marks estimates', () => {
    expect(itemValue({ quantity: 1, unit: 'pcs', priceRappen: rappen(195) }, milk)).toEqual({
      valueRappen: 195,
      estimated: false,
    });
    expect(itemValue({ quantity: 3, unit: 'pcs' }, milk)).toEqual({
      valueRappen: 495,
      estimated: true,
    });
  });
});
