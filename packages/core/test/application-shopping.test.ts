import { beforeEach, describe, expect, it } from 'vitest';
import {
  CommandError,
  createMemoryStorage,
  createShoppingUseCases,
  InventoryItemSchema,
  IsoDateTimeSchema,
  localDate,
  ProductSchema,
  uuidV7,
  type Id,
  type Storage,
} from '../src';

/**
 * The shopping use cases on memory storage: the application layer runs without a browser or a
 * database (ADR-0034). The same use cases on IndexedDB: apps/web/src/data/shopping.dexie.test.ts.
 */
let storage: Storage;
let shopping: ReturnType<typeof createShoppingUseCases>;
let next: () => Id;
const householdId = id(1);
const actor = id(2);
const now = IsoDateTimeSchema.parse('2026-11-07T09:00:00.000Z');

function id(counter: number): Id {
  const random = new Uint8Array(10);
  random[9] = counter;
  return uuidV7(1_762_500_000_000 + counter, random);
}

beforeEach(() => {
  let counter = 10;
  next = () => id((counter += 1));
  storage = createMemoryStorage();
  shopping = createShoppingUseCases({
    storage,
    clock: { now: () => now, today: () => localDate('2026-11-07') },
    ids: { next },
    actor,
  });
});

const add = (name: string, commandId = next()) =>
  shopping['shopping.addItem']({ commandId, householdId, name });

async function putMilkAtHome() {
  const product = ProductSchema.parse({
    id: next(),
    householdId,
    updatedAt: now,
    name: 'Vollmilch',
    categoryId: 'dairy-milk',
    defaultLocation: 'fridge',
    source: 'manual',
  });
  await storage.products.add(product);
  await storage.items.add(
    InventoryItemSchema.parse({
      id: next(),
      householdId,
      updatedAt: now,
      productId: product.id,
      location: 'fridge',
      quantity: 1,
      unit: 'pcs',
      purchasedAt: now,
      expiresOn: '2026-11-09',
      expiryKind: 'best_before',
      expirySource: 'manual',
      owner: 'shared',
      status: 'active',
    }),
  );
}

describe('shopping use cases on memory storage', () => {
  it('adds an entry with its category and records one event', async () => {
    const result = await add('Vollmilch');
    expect(result).toMatchObject({ alreadyOnList: false, alreadyAtHome: false });
    const { items } = await shopping['shopping.list']({ householdId, includeChecked: false });
    expect(items).toEqual([
      expect.objectContaining({ name: 'Vollmilch', categoryId: 'dairy-milk', checked: false }),
    ]);
    const events = await storage.events.ofHousehold(householdId);
    expect(events.map((event) => event.type)).toEqual(['shopping_list.item_added']);
  });

  it('returns the stored result for a repeated command instead of adding twice', async () => {
    const commandId = next();
    const first = await add('Butter', commandId);
    const again = await add('Butter', commandId);
    expect(again).toEqual(first);
    expect(await storage.shoppingItems.ofHousehold(householdId)).toHaveLength(1);
  });

  it('warns about the same food still at home', async () => {
    await putMilkAtHome();
    const result = await add('Milch');
    expect(result.alreadyAtHome).toBe(true);
    expect(result.atHome).toMatchObject({ name: 'Vollmilch', count: 1, expiresOn: '2026-11-09' });
  });

  it('checks, unchecks and removes entries', async () => {
    const { itemId } = await add('Eier');
    const check = (checked: boolean) =>
      shopping['shopping.check']({ commandId: next(), householdId, itemId, checked });
    await check(true);
    expect((await storage.shoppingItems.get(itemId))?.checkedAt).toBe(now);
    await check(false);
    expect((await storage.shoppingItems.get(itemId))?.checkedAt).toBeUndefined();
    await shopping['shopping.remove']({ commandId: next(), householdId, itemId });
    expect((await shopping['shopping.list']({ householdId, includeChecked: true })).items).toEqual(
      [],
    );
  });

  it('rejects unknown entries and leaves no trace of the failed command', async () => {
    const commandId = next();
    await expect(
      shopping['shopping.remove']({ commandId, householdId, itemId: next() }),
    ).rejects.toThrow(CommandError);
    expect(await storage.commands.find(commandId)).toBeUndefined();
    expect(await storage.events.ofHousehold(householdId)).toEqual([]);
  });
});

describe('memory storage', () => {
  it('rolls back every write of a failing transaction', async () => {
    const { itemId } = await add('Joghurt');
    const row = await storage.shoppingItems.get(itemId);
    expect(row).toBeDefined();
    await expect(
      storage.transaction(async () => {
        if (row !== undefined) {
          await storage.shoppingItems.put({ ...row, name: 'Quark' });
        }
        throw new Error('stop');
      }),
    ).rejects.toThrow('stop');
    expect((await storage.shoppingItems.get(itemId))?.name).toBe('Joghurt');
  });

  it('hands out copies, so changing a read row does not change the stored one', async () => {
    const { itemId } = await add('Brot');
    const row = await storage.shoppingItems.get(itemId);
    if (row !== undefined) {
      row.name = 'Zopf';
    }
    expect((await storage.shoppingItems.get(itemId))?.name).toBe('Brot');
  });
});
