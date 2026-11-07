import 'fake-indexeddb/auto';
import { createShoppingUseCases, type Id, type ShoppingUseCases } from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import { appContext } from './command';
import type { FridgeDb } from './db';
import { createInventoryHandlers, type InventoryHandlers } from './handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

let db: FridgeDb;
let inventory: InventoryHandlers;
let shopping: ShoppingUseCases;
let householdId: Id;
let ids: ReturnType<typeof sequentialIds>;

beforeEach(async () => {
  db = testDb();
  ids = sequentialIds();
  const clock = fixedClock('2026-11-06T09:00:00.000Z', '2026-11-06');
  const profile = await ensureLocalHousehold(db, clock, ids, { household: 'WG', member: 'Lena' });
  householdId = profile.household.id;
  const ctx = { db, clock, ids, actor: profile.member.id };
  inventory = createInventoryHandlers(ctx);
  shopping = createShoppingUseCases(appContext(ctx));
});

const add = (name: string) =>
  shopping['shopping.addItem']({ commandId: ids.next(), householdId, name });
const check = (itemId: Id, checked: boolean) =>
  shopping['shopping.check']({ commandId: ids.next(), householdId, itemId, checked });
const list = (includeChecked = false) => shopping['shopping.list']({ householdId, includeChecked });

describe('shopping list', () => {
  it('adds entries in order with the category emoji and an event', async () => {
    await add('Vollmilch');
    await add('Abwaschmittel');
    const { items } = await list();
    expect(items.map((item) => [item.name, item.emoji, item.checked])).toEqual([
      ['Vollmilch', '🥛', false],
      ['Abwaschmittel', '🧽', false],
    ]);
    expect(await db.events.where('type').equals('shopping_list.item_added').count()).toBe(2);
  });

  it('warns about the same kind of food at home (E-02) and does not add twice', async () => {
    await inventory['inventory.addItem']({
      commandId: ids.next(),
      householdId,
      name: 'Bio Vollmilch',
      location: 'fridge',
      quantity: 2,
    });
    const first = await add('Milch');
    expect(first).toMatchObject({
      alreadyAtHome: true,
      alreadyOnList: false,
      atHome: { name: 'Bio Vollmilch', quantity: 2, unit: 'pcs', count: 1 },
    });
    const again = await add('  milch ');
    expect(again).toMatchObject({ itemId: first.itemId, alreadyOnList: true });
    const { items } = await list();
    expect(items).toHaveLength(1);
    expect(items[0]?.atHome?.name).toBe('Bio Vollmilch');
    expect((await add('Rüebli')).alreadyAtHome).toBe(false);
  });

  it('checks off into the basket, opens again and removes', async () => {
    const milk = await add('Vollmilch');
    const bread = await add('Ruchbrot');
    expect(await check(milk.itemId, true)).toEqual({ checked: true });
    expect((await list()).items.map((item) => item.name)).toEqual(['Ruchbrot']);
    expect((await list(true)).items.map((item) => [item.name, item.checked])).toEqual([
      ['Ruchbrot', false],
      ['Vollmilch', true],
    ]);
    // A checked entry no longer blocks adding the same thing again.
    expect((await add('Vollmilch')).alreadyOnList).toBe(false);

    await check(milk.itemId, false);
    expect((await db.shoppingItems.get(milk.itemId))?.checkedAt).toBeUndefined();
    expect(
      await shopping['shopping.remove']({
        commandId: ids.next(),
        householdId,
        itemId: bread.itemId,
      }),
    ).toEqual({ removed: true });
    expect((await list(true)).items.map((item) => item.name)).not.toContain('Ruchbrot');
    const types = (await db.events.toArray()).map((event) => event.type);
    expect(types).toEqual(
      expect.arrayContaining([
        'shopping_list.item_checked',
        'shopping_list.item_unchecked',
        'shopping_list.item_removed',
      ]),
    );
    await expect(
      shopping['shopping.remove']({ commandId: ids.next(), householdId, itemId: bread.itemId }),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});
