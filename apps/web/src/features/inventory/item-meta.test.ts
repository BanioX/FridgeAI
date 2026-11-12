import type { InventoryItemView } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { itemMeta } from './item-meta';

const item = (fields: Pick<InventoryItemView, 'quantity' | 'unit' | 'location'>) =>
  fields as InventoryItemView;

describe('itemMeta', () => {
  it('shows what is left in a readable unit and the place', () => {
    expect(itemMeta(item({ quantity: 2 / 3, unit: 'pcs', location: 'fridge' }))).toBe(
      '⅔ Stk. · Kühlschrank',
    );
    expect(itemMeta(item({ quantity: 0.3, unit: 'pcs', location: 'fridge' }))).toBe(
      '0.3 Stk. · Kühlschrank',
    );
    expect(itemMeta(item({ quantity: 1000, unit: 'g', location: 'pantry' }))).toBe('1 kg · Vorrat');
    expect(itemMeta(item({ quantity: 750, unit: 'g', location: 'freezer' }))).toBe(
      '750 g · Tiefkühler',
    );
  });

  it('names the spot instead of the location, but only when asked to', () => {
    const withSpot = {
      quantity: 1,
      unit: 'pcs',
      location: 'pantry',
      spot: { id: 's', name: 'Oberer Schrank links', hasPhoto: false },
    } as InventoryItemView;
    expect(itemMeta(withSpot)).toBe('1 Stk. · Oberer Schrank links');
    expect(itemMeta(withSpot, false)).toBe('1 Stk. · Vorrat');
    expect(itemMeta({ ...withSpot, spot: null })).toBe('1 Stk. · Vorrat');
  });
});
