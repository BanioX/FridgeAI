import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { FridgeDb } from './db';

describe('FridgeDb migrations', () => {
  it('keeps everything from version 1 and adds the later tables', async () => {
    const name = `migration-${crypto.randomUUID()}`;
    const v1 = new Dexie(name);
    v1.version(1).stores({
      households: 'id',
      members: 'id, householdId',
      products: 'id, householdId, gtin',
      items: 'id, householdId, [householdId+status], productId, expiresOn',
      outcomes: 'id, householdId, itemId, at',
      reminderPrefs: 'id, householdId, memberId',
      events: 'id, householdId, type, at',
      commands: 'commandId',
      meta: 'key',
    });
    await v1.table('meta').put({ key: 'currentHouseholdId', value: 'h-1' });
    await v1.table('products').put({ id: 'p-1', householdId: 'h-1', gtin: '7610000000004' });
    v1.close();

    const db = new FridgeDb(name);
    expect(await db.meta.get('currentHouseholdId')).toEqual({
      key: 'currentHouseholdId',
      value: 'h-1',
    });
    expect(await db.products.where('gtin').equals('7610000000004').count()).toBe(1);
    expect(await db.catalogCache.count()).toBe(0);
    expect(await db.shoppingItems.count()).toBe(0);
    expect(await db.productImages.count()).toBe(0);
    expect(await db.receipts.count()).toBe(0);
    expect(await db.receiptLines.count()).toBe(0);
    expect(db.verno).toBe(5);
    db.close();
  });
});
