import type { Id, InventoryItemView, StorageLocation } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { putAwaySections } from './put-away';

const item = (id: string, location: StorageLocation, spot: string | null): InventoryItemView =>
  ({
    id: id as Id,
    name: `Artikel ${id}`,
    location,
    spot: spot === null ? null : { id: `spot-${spot}` as Id, name: spot, hasPhoto: false },
  }) as InventoryItemView;

describe('putAwaySections', () => {
  const stock = [
    item('a', 'pantry', null),
    item('b', 'fridge', 'Türfach'),
    item('c', 'fridge', null),
    item('d', 'fridge', 'Gemüsefach'),
    item('e', 'fridge', 'Türfach'),
    item('f', 'freezer', null),
  ];

  it('orders locations as the tabs do and skips empty ones', () => {
    const sections = putAwaySections(stock, ['a', 'b', 'f']);
    expect(sections.map((section) => section.location)).toEqual(['fridge', 'freezer', 'pantry']);
    expect(putAwaySections(stock, ['a']).map((section) => section.location)).toEqual(['pantry']);
  });

  it('groups by spot name, items without a spot last', () => {
    const [fridge] = putAwaySections(stock, ['b', 'c', 'd', 'e']);
    expect(fridge?.groups.map((group) => group.spot?.name ?? null)).toEqual([
      'Gemüsefach',
      'Türfach',
      null,
    ]);
    expect(fridge?.groups[1]?.items.map((entry) => entry.id)).toEqual(['b', 'e']);
  });

  it('ignores ids that are not in the stock', () => {
    expect(putAwaySections(stock, ['gone'])).toEqual([]);
    expect(putAwaySections(stock, [])).toEqual([]);
  });
});
