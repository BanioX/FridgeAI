import 'fake-indexeddb/auto';
import { GtinSchema, type Id, type ProductSearch } from '@fridgeai/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import type { FridgeDb } from './db';
import { createInventoryHandlers, type InventoryHandlers } from './handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

const gipfeli = GtinSchema.parse('7610000000004');
const weggli = GtinSchema.parse('96385074');

let db: FridgeDb;
let householdId: Id;
let ids: ReturnType<typeof sequentialIds>;
let handlers: (search?: ProductSearch) => InventoryHandlers;

beforeEach(async () => {
  db = testDb();
  ids = sequentialIds();
  const clock = fixedClock('2026-11-06T09:00:00.000Z', '2026-11-06');
  const profile = await ensureLocalHousehold(db, clock, ids, { household: 'WG', member: 'Lena' });
  householdId = profile.household.id;
  handlers = (search) =>
    createInventoryHandlers({
      db,
      clock,
      ids,
      actor: profile.member.id,
      ...(search === undefined ? {} : { search }),
    });
});

describe('products.search', () => {
  it('finds own products first, then Swiss products from the open database', async () => {
    const searchByName = vi.fn<ProductSearch['searchByName']>(() =>
      Promise.resolve([
        { gtin: gipfeli, name: 'Gipfeli', brand: 'Coop', packSize: '4 × 45 g' },
        { gtin: weggli, name: 'Weggli', brand: 'Coop' },
      ]),
    );
    const inventory = handlers({ searchByName });
    await inventory['inventory.addItem']({
      commandId: ids.next(),
      householdId,
      name: 'Coop Weggli',
      gtin: weggli,
      location: 'pantry',
      quantity: 6,
    });

    const result = await inventory['products.search']({ householdId, query: ' coop weggli ' });
    expect(searchByName).toHaveBeenCalledWith('coop weggli', 8);
    expect(result.openDatabase).toBe('searched');
    expect(result.products).toEqual([
      expect.objectContaining({ name: 'Coop Weggli', gtin: weggli, source: 'household' }),
      expect.objectContaining({
        name: 'Gipfeli',
        gtin: gipfeli,
        brand: 'Coop',
        packSize: '4 × 45 g',
        categoryId: expect.any(String) as string,
        source: 'off',
      }),
    ]);
  });

  it('keeps the own products when the open database is unavailable or not there', async () => {
    const offline = handlers({ searchByName: () => Promise.resolve('unavailable') });
    await offline['inventory.addItem']({
      commandId: ids.next(),
      householdId,
      name: 'Gipfeli',
      location: 'pantry',
      quantity: 4,
    });
    expect(await offline['products.search']({ householdId, query: 'gipfeli' })).toEqual({
      products: [expect.objectContaining({ name: 'Gipfeli', source: 'household' })],
      openDatabase: 'unavailable',
    });
    expect(
      (await handlers()['products.search']({ householdId, query: 'gipfeli' })).openDatabase,
    ).toBe('none');
  });

  it('refuses one-letter searches', async () => {
    await expect(handlers()['products.search']({ householdId, query: 'g' })).rejects.toThrow();
  });
});
