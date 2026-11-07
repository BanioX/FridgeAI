import 'fake-indexeddb/auto';
import { IsoDateTimeSchema, type Id } from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import type { FridgeDb } from './db';
import { createInventoryHandlers, type InventoryHandlers } from './handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

/**
 * `products.frequent` on IndexedDB (Dexie). The logic lives in
 * packages/core/src/application/insights.ts.
 */

let db: FridgeDb;
let inventory: InventoryHandlers;
let householdId: Id;
let ids: ReturnType<typeof sequentialIds>;

beforeEach(async () => {
  db = testDb();
  ids = sequentialIds();
  const clock = fixedClock('2026-11-06T09:00:00.000Z', '2026-11-06');
  const profile = await ensureLocalHousehold(db, clock, ids, { household: 'WG', member: 'Lena' });
  householdId = profile.household.id;
  inventory = createInventoryHandlers({ db, clock, ids, actor: profile.member.id });
});

const add = (name: string, quantity = 1, location: 'fridge' | 'pantry' = 'fridge') =>
  inventory['inventory.addItem']({ commandId: ids.next(), householdId, name, location, quantity });

describe('products.frequent (UC-07)', () => {
  it('lists the usual products with the amount added last time', async () => {
    await add('Vollmilch');
    await add('Ruchbrot', 1, 'pantry');
    await add('Vollmilch', 2);
    const { products } = await inventory['products.frequent']({ householdId });
    expect(products).toEqual([
      expect.objectContaining({
        name: 'Vollmilch',
        emoji: '🥛',
        timesAdded: 2,
        location: 'fridge',
        quantity: 2,
        unit: 'pcs',
      }),
      expect.objectContaining({ name: 'Ruchbrot', timesAdded: 1, location: 'pantry', quantity: 1 }),
    ]);
  });

  it('restores the added amount after eating and ignores deleted mistakes', async () => {
    const yoghurt = await add('Joghurt', 4);
    await inventory['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId: yoghurt.itemId,
      outcome: 'eaten',
      quantity: 3,
    });
    const typo = await add('Joghrt');
    await inventory['inventory.deleteItem']({
      commandId: ids.next(),
      householdId,
      itemId: typo.itemId,
    });

    const { products } = await inventory['products.frequent']({ householdId, limit: 5 });
    expect(products.map((product) => [product.name, product.quantity])).toEqual([['Joghurt', 4]]);
  });

  it('forgets additions older than half a year', async () => {
    const old = await add('Rahm');
    await db.items.update(old.itemId, {
      purchasedAt: IsoDateTimeSchema.parse('2026-04-01T09:00:00.000Z'),
    });
    expect((await inventory['products.frequent']({ householdId })).products).toEqual([]);
  });
});
