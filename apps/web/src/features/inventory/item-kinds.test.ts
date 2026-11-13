import { CATEGORIES } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { groupByKind, KINDS, kindOf, type Kind } from './item-kinds';

const item = (categoryId: string, origin?: 'made' | 'leftover') => ({
  categoryId,
  ...(origin === undefined ? {} : { origin }),
});

describe('kindOf', () => {
  it('keeps fruit apart from vegetables', () => {
    expect(kindOf(item('produce-carrots'))).toBe('vegetables');
    expect(kindOf(item('produce-tomatoes'))).toBe('vegetables');
    expect(kindOf(item('frozen-vegetables'))).toBe('vegetables');
    for (const id of [
      'produce-berries',
      'produce-apples',
      'produce-bananas',
      'produce-citrus',
      'produce-avocado',
      'produce-fruit',
    ]) {
      expect(kindOf(item(id))).toBe('fruit');
    }
  });

  it('puts the moved categories where a person looks for them', () => {
    expect(kindOf(item('frozen-icecream'))).toBe('sweets');
    expect(kindOf(item('prepared-desserts'))).toBe('sweets');
    expect(kindOf(item('pantry-sweets'))).toBe('sweets');
    expect(kindOf(item('pantry-sauces'))).toBe('tins');
    expect(kindOf(item('pantry-tomato-paste'))).toBe('tins');
    expect(kindOf(item('pantry-canned'))).toBe('tins');
    expect(kindOf(item('pantry-oil'))).toBe('spices');
    expect(kindOf(item('pantry-spices'))).toBe('spices');
    expect(kindOf(item('pantry-coffee-tea'))).toBe('drinks');
    expect(kindOf(item('reserve-water'))).toBe('drinks');
    expect(kindOf(item('prepared-leftovers'))).toBe('leftovers');
    expect(kindOf(item('frozen-meals'))).toBe('ready');
  });

  it('follows the catalogue group otherwise', () => {
    expect(kindOf(item('fish-fresh'))).toBe('fish');
    expect(kindOf(item('meat-coldcuts'))).toBe('meat');
    expect(kindOf(item('dairy-eggs'))).toBe('dairy');
    expect(kindOf(item('pantry-pasta'))).toBe('grains');
    expect(kindOf(item('nonfood-cleaning'))).toBe('household');
  });

  it('counts Reste as Reste, whatever their category', () => {
    expect(kindOf(item('meat-minced', 'leftover'))).toBe('leftovers');
    expect(kindOf(item('bakery-homemade', 'made'))).toBe('bakery');
  });

  it('gives every catalogue category a kind; only «Anderes» and unknown ids land in «other»', () => {
    const others = CATEGORIES.filter((category) => kindOf(item(category.id)) === 'other');
    expect(others.map((category) => category.id)).toEqual(['pantry-other']);
    expect(kindOf(item('no-such-category'))).toBe('other');
    for (const category of CATEGORIES) {
      expect(KINDS).toContain(kindOf(item(category.id)));
    }
  });
});

describe('groupByKind', () => {
  it('orders the kinds by what spoils first and keeps the order inside a kind', () => {
    const items = [
      { name: 'Äpfel', ...item('produce-apples') },
      { name: 'Lachs', ...item('fish-fresh') },
      { name: 'Rüebli', ...item('produce-carrots') },
      { name: 'Birnen', ...item('produce-fruit') },
      { name: 'Hackfleisch', ...item('meat-minced') },
    ];
    expect(
      groupByKind(items).map((group) => [group.kind, group.items.map((entry) => entry.name)]),
    ).toEqual([
      ['fish', ['Lachs']],
      ['meat', ['Hackfleisch']],
      ['vegetables', ['Rüebli']],
      ['fruit', ['Äpfel', 'Birnen']],
    ]);
  });

  it('follows a given order of the kinds instead', () => {
    const items = [
      { name: 'Lachs', ...item('fish-fresh') },
      { name: 'Äpfel', ...item('produce-apples') },
    ];
    const order: Kind[] = ['fruit', ...KINDS.filter((kind) => kind !== 'fruit')];
    expect(groupByKind(items, order).map((group) => group.kind)).toEqual(['fruit', 'fish']);
  });

  it('returns nothing for an empty list', () => {
    expect(groupByKind([])).toEqual([]);
  });
});
