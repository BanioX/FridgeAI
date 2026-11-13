import { describe, expect, it } from 'vitest';
import { KINDS } from '../inventory/item-kinds';
import { groupShopping, SHOP_ORDER, shoppingKindOf } from './shopping-kinds';

describe('shoppingKindOf', () => {
  it('takes the kind of the entry category first', () => {
    // The name says milk, the category says fish: the category wins.
    expect(shoppingKindOf({ name: 'Milch', categoryId: 'fish-fresh' })).toBe('fish');
  });

  it('guesses the kind from the name without a category', () => {
    expect(shoppingKindOf({ name: 'Äpfel' })).toBe('fruit');
    expect(shoppingKindOf({ name: 'Rüebli' })).toBe('vegetables');
    expect(shoppingKindOf({ name: 'Vollmilch' })).toBe('dairy');
  });

  it('falls back to other for an unknown name', () => {
    expect(shoppingKindOf({ name: 'Xyzzy' })).toBe('other');
  });
});

describe('SHOP_ORDER', () => {
  it('lists every kind exactly once, fruit and vegetables first', () => {
    expect([...SHOP_ORDER].sort()).toEqual([...KINDS].sort());
    expect(SHOP_ORDER.slice(0, 3)).toEqual(['fruit', 'vegetables', 'bakery']);
  });
});

describe('groupShopping', () => {
  it('orders the blocks like a walk through the shop and keeps the list order inside', () => {
    const entries = [
      { name: 'Vollmilch' },
      { name: 'Rüebli' },
      { name: 'Äpfel' },
      { name: 'Birnen' },
    ];
    expect(groupShopping(entries).map((g) => [g.kind, g.items.map((e) => e.name)])).toEqual([
      ['fruit', ['Äpfel', 'Birnen']],
      ['vegetables', ['Rüebli']],
      ['dairy', ['Vollmilch']],
    ]);
  });

  it('returns nothing for an empty list', () => {
    expect(groupShopping([])).toEqual([]);
  });
});
