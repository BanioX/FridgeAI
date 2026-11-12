import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/catalog/categories';
import {
  CategoryGroupSchema,
  CategorySchema,
  DEFAULT_PORTIONING,
  PortioningSchema,
  portioningOf,
} from '../src/catalog/category';

describe('CATEGORIES', () => {
  it('has every category pass the schema', () => {
    for (const category of CATEGORIES) {
      expect(() => CategorySchema.parse(category), category.id).not.toThrow();
    }
  });

  it('has unique ids', () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses no keyword in two categories', () => {
    const owner = new Map<string, string>();
    for (const category of CATEGORIES) {
      for (const keyword of category.keywords) {
        const previous = owner.get(keyword);
        expect(previous, `«${keyword}» in ${category.id} and ${previous ?? '-'}`).toBeUndefined();
        owner.set(keyword, category.id);
      }
    }
  });

  it('has 2 to 8 keywords per category', () => {
    for (const category of CATEGORIES) {
      expect(category.keywords.length, category.id).toBeGreaterThanOrEqual(2);
      expect(category.keywords.length, category.id).toBeLessThanOrEqual(8);
    }
  });

  it('marks all meat and fish categories as use_by', () => {
    const raw = CATEGORIES.filter((c) => c.id.startsWith('meat-') || c.id.startsWith('fish-'));
    expect(raw.length).toBeGreaterThanOrEqual(7);
    for (const category of raw) {
      expect(category.dateKind, category.id).toBe('use_by');
    }
  });

  it('covers every group, non_food with at least two categories', () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(35);
    for (const group of CategoryGroupSchema.options) {
      const count = CATEGORIES.filter((c) => c.group === group).length;
      expect(count, group).toBeGreaterThanOrEqual(group === 'non_food' ? 2 : 1);
    }
  });

  it('gives every food category a tip and keeps texts free of «ß»', () => {
    for (const category of CATEGORIES) {
      if (category.isFood) {
        expect(category.tips.de.length, category.id).toBeGreaterThanOrEqual(1);
      }
      for (const text of [...category.tips.de, category.name.de]) {
        expect(text, category.id).not.toContain('ß');
      }
    }
  });

  it('shares non-food categories by default and gives them a long shelf life', () => {
    for (const category of CATEGORIES.filter((c) => !c.isFood)) {
      expect(category.defaultOwner, category.id).toBe('shared');
      expect(category.shelfLifeDays.pantry, category.id).toBe(3650);
    }
  });

  it('never suggests trying use_by foods after the date', () => {
    for (const category of CATEGORIES.filter((c) => c.dateKind === 'use_by')) {
      expect(category.tips.de.join(' '), category.id).not.toMatch(/probieren/);
    }
  });
});

describe('portioning', () => {
  const byId = (id: string) => {
    const category = CATEGORIES.find((c) => c.id === id);
    if (category === undefined) {
      throw new Error(id);
    }
    return portioningOf(category);
  };

  it('counts eggs in boxes of 6 or 10 and never splits them', () => {
    expect(byId('dairy-eggs')).toEqual({
      unit: 'pcs',
      container: 'box',
      packs: [6, 10],
      splits: [],
    });
  });

  it('counts cheese slices one by one in packs of 8, 10 or 12 (ADR-0063)', () => {
    expect(byId('dairy-cheese-slices')).toEqual({ unit: 'pcs', packs: [8, 10, 12], splits: [] });
  });

  it('counts bananas and yoghurt cups, cuts cake in eighths and hard cheese in thirds', () => {
    expect(byId('produce-bananas').unit).toBe('pcs');
    expect(byId('dairy-yoghurt')).toMatchObject({ unit: 'pcs', container: 'cup' });
    expect(byId('bakery-pastry').splits).toContain(8);
    expect(byId('dairy-cheese-hard')).toMatchObject({ unit: 'g', splits: [3, 4] });
  });

  it('measures loose staples in grams or millilitres', () => {
    expect(byId('pantry-rice').unit).toBe('g');
    expect(byId('dairy-milk').unit).toBe('ml');
  });

  it('falls back to pieces in quarters', () => {
    expect(byId('pantry-other')).toEqual(DEFAULT_PORTIONING);
  });

  it('rejects pack sizes for amounts', () => {
    expect(PortioningSchema.safeParse({ unit: 'g', packs: [6], splits: [] }).success).toBe(false);
  });
});
