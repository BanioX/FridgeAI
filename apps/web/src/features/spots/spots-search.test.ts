import type { InventoryItemView } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { findInStock, fold, searchStock } from './spots-search';

const item = (id: string, name: string) => ({ id, name }) as InventoryItemView;
const stock = [item('1', 'Kristallzucker'), item('2', 'Crème fraîche'), item('3', 'Tee')];

describe('findInStock', () => {
  it('finds by part of the name, ignoring case and accents', () => {
    expect(findInStock(stock, 'zucker').map((entry) => entry.id)).toEqual(['1']);
    expect(findInStock(stock, 'CREME').map((entry) => entry.id)).toEqual(['2']);
  });

  it('finds nothing for an empty or blank query', () => {
    expect(findInStock(stock, '')).toEqual([]);
    expect(findInStock(stock, '   ')).toEqual([]);
  });

  it('folds text', () => {
    expect(fold('  Äpfel ')).toBe('apfel');
  });
});

describe('searchStock', () => {
  const owned = (id: string, name: string, owner: string, spotId: string | null) =>
    ({
      id,
      name,
      owner,
      spot: spotId === null ? null : { id: spotId, name: spotId },
    }) as unknown as InventoryItemView;
  const goods = [
    owned('1', 'Gurke', 'm-mia', 'drawer'),
    owned('2', 'Butter', 'm-ben', null),
    owned('3', 'Milch', 'shared', 'drawer'),
    owned('4', 'Tee', 'shared', 'shelf'),
  ];
  const spots = [
    { id: 'drawer', name: 'Gemüsefach' },
    { id: 'shelf', name: 'Regal' },
  ];
  const mia = { id: 'm-mia', displayName: 'Mia', initials: 'M' };
  const ben = { id: 'm-ben', displayName: 'Ben', initials: 'B' };
  const ids = (list: { id: string }[]) => list.map((entry) => entry.id);

  it('finds a spot by name, ignoring case and accents, with all items that lie there', () => {
    const found = searchStock(goods, spots, [mia, ben], 'GEMUSEFACH');
    expect(ids(found.spots)).toEqual(['drawer']);
    expect(ids(found.items)).toEqual(['1', '3']);
  });

  it('finds the items of a person by name or initials with two or more people', () => {
    expect(ids(searchStock(goods, spots, [mia, ben], 'mia').items)).toEqual(['1']);
    expect(ids(searchStock(goods, spots, [mia, ben], 'B').items)).toEqual(['2']);
  });

  it('does not search by person with one member', () => {
    expect(searchStock(goods, spots, [mia], 'mia').items).toEqual([]);
  });

  it('lists an item once, and finds nothing for a blank query', () => {
    expect(ids(searchStock(goods, spots, [mia, ben], 'm').items)).toEqual(['1', '3']);
    expect(searchStock(goods, spots, [mia, ben], '  ')).toEqual({ spots: [], items: [] });
  });
});
