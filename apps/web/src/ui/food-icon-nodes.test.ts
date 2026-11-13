import { CATEGORIES } from '@fridgeai/core';
import { ShoppingBasket } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { CATEGORY_ICONS, categoryIcon } from './food-icon-nodes';

describe('food pictures (ADR-0080)', () => {
  it('has a picture for every category of the catalog', () => {
    const missing = CATEGORIES.map((category) => category.id).filter(
      (id) => CATEGORY_ICONS[id] === undefined,
    );
    expect(missing).toEqual([]);
  });

  it('falls back to the basket for an unknown category', () => {
    expect(categoryIcon('no-such-category')).toBe(ShoppingBasket);
  });
});
