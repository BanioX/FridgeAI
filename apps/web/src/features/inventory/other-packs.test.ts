import type { InventoryItemView } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { otherPacks } from './other-packs';

const pack = (id: string, productId: string, expiresOn: string) =>
  ({ id, productId, name: 'Joghurt', expiresOn }) as InventoryItemView;

describe('otherPacks', () => {
  it('lists the other packs of the same product, the one expiring first on top', () => {
    const current = pack('b', 'yoghurt', '2026-11-20');
    const items = [
      pack('c', 'yoghurt', '2026-11-30'),
      current,
      pack('x', 'milk', '2026-11-10'),
      pack('a', 'yoghurt', '2026-11-12'),
      pack('d', 'yoghurt', '2026-11-12'),
    ];
    expect(otherPacks(items, current).map((other) => other.id)).toEqual(['a', 'd', 'c']);
  });

  it('is empty for a product with one pack', () => {
    const current = pack('b', 'yoghurt', '2026-11-20');
    expect(otherPacks([current, pack('x', 'milk', '2026-11-10')], current)).toEqual([]);
  });
});
