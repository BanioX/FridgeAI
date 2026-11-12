import { describe, expect, it } from 'vitest';
import { normalizeFoodText } from '../src/catalog/match';
import { NutritionSchema } from '../src/model/inventory';
import { BLV_VERSION, FRESH_FOODS } from '../src/nutrition/fresh-nutrition.data';

describe('fresh-nutrition.data (ADR-0064)', () => {
  it('comes from the BLV database 7.1 and covers the common fresh foods', () => {
    expect(BLV_VERSION).toBe('V 7.1');
    const foods = FRESH_FOODS.map((row) => row.food);
    for (const food of ['Thunfisch, roh', 'Apfel, roh', 'Rind, Gehacktes, roh']) {
      expect(foods).toContain(food);
    }
  });

  it('has foods with unique ids and keywords, normalised like the matching', () => {
    expect(new Set(FRESH_FOODS.map((row) => row.id)).size).toBe(FRESH_FOODS.length);
    const keywords = FRESH_FOODS.flatMap((row) => row.kw);
    expect(new Set(keywords).size).toBe(keywords.length);
    for (const keyword of keywords) {
      expect(normalizeFoodText(keyword)).toBe(keyword);
      expect(keyword.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('has values that pass the nutrition schema', () => {
    for (const row of FRESH_FOODS) {
      expect(Object.keys(row.n).length, row.food).toBeGreaterThan(0);
      const parsed = NutritionSchema.safeParse({ basis: '100g', ...row.n, source: 'blv' });
      expect(parsed.success, row.food).toBe(true);
    }
  });
});
