import type { InventoryItemView } from '@fridgeai/core';
import { describe, expect, it, vi } from 'vitest';
import { applySpot, sharedLocation } from './bulk-edit';

function item(id: string, productId: string, location = 'fridge'): InventoryItemView {
  return { id, productId, name: id, location } as InventoryItemView;
}

describe('applySpot', () => {
  it('calls once per product, however many packs of it are chosen', async () => {
    const setSpot = vi.fn(() => Promise.resolve());
    const items = [item('a1', 'milk'), item('a2', 'milk'), item('b', 'butter')];
    const result = await applySpot(items, setSpot);
    expect(setSpot.mock.calls).toEqual([['milk'], ['butter']]);
    expect(result.changed.map((entry) => entry.id)).toEqual(['a1', 'a2', 'b']);
    expect(result.failed).toEqual([]);
  });

  it('reports every pack of a product whose call failed, and goes on', async () => {
    const setSpot = vi.fn((productId: string) =>
      productId === 'milk' ? Promise.reject(new Error('no')) : Promise.resolve(),
    );
    const items = [item('a1', 'milk'), item('a2', 'milk'), item('b', 'butter')];
    const result = await applySpot(items, setSpot);
    expect(result.failed.map((entry) => entry.id)).toEqual(['a1', 'a2']);
    expect(result.changed.map((entry) => entry.id)).toEqual(['b']);
  });
});

describe('sharedLocation', () => {
  it('is the common location, or null for mixed or no items', () => {
    expect(sharedLocation([item('a', 'p'), item('b', 'q')])).toBe('fridge');
    expect(sharedLocation([item('a', 'p'), item('b', 'q', 'pantry')])).toBeNull();
    expect(sharedLocation([])).toBeNull();
  });
});
