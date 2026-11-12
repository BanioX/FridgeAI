import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/catalog/categories';
import { categoryById } from '../src/catalog/match';
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

describe('categories with pack sizes', () => {
  // The quantity counts single pieces (10 eggs, 6 bottles), so price and weight are per piece.
  // Before 12.11.2026 eggs held the price of a 10er box: 10 eggs showed CHF 52.00.
  it('give price and weight per piece, not per pack', () => {
    const eggs = categoryById('dairy-eggs');
    expect(eggs).toBeDefined();
    expect(estimateFromCategory(10, 'pcs', eggs ?? {})).toEqual({ valueRappen: 520, grams: 600 });
    for (const category of CATEGORIES.filter((entry) => entry.portioning?.packs !== undefined)) {
      expect(category.avgWeightGrams ?? 0, category.id).toBeLessThanOrEqual(2000);
      expect(category.avgPriceRappen ?? 0, category.id).toBeLessThanOrEqual(1000);
    }
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
