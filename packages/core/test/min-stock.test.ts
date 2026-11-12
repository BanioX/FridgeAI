import { beforeEach, describe, expect, it } from 'vitest';
import {
  CommandError,
  CONTRACT_V1,
  createHouseholdUseCases,
  createInventoryUseCases,
  createMemoryStorage,
  createShoppingUseCases,
  HouseholdExportSchema,
  IsoDateTimeSchema,
  localDate,
  uuidV7,
  type Id,
  type Storage,
} from '../src';

/** «Immer da haben» (ADR-0059) on memory storage: the minimum stock fills «Nachkaufen». */
let storage: Storage;
let inventory: ReturnType<typeof createInventoryUseCases>;
let shopping: ReturnType<typeof createShoppingUseCases>;
let household: ReturnType<typeof createHouseholdUseCases>;
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
  const ctx = {
    storage,
    clock: { now: () => now, today: () => localDate('2026-11-07') },
    ids: { next },
    actor,
  };
  inventory = createInventoryUseCases(ctx);
  shopping = createShoppingUseCases(ctx);
  household = createHouseholdUseCases(ctx);
});

const add = (name = 'Vollmilch') =>
  inventory['inventory.addItem']({ commandId: next(), householdId, name, location: 'fridge' });

const productOf = async (name: string) => {
  const product = (await storage.products.ofHousehold(householdId)).find(
    (candidate) => candidate.name === name,
  );
  if (product === undefined) {
    throw new Error(`No product ${name}`);
  }
  return product;
};

const setMin = (productId: Id, minStock: number | null) =>
  inventory['products.setMinStock']({ commandId: next(), householdId, productId, minStock });

const outcome = (itemId: Id, kind: 'eaten' | 'wasted' = 'eaten') =>
  inventory['inventory.recordOutcome']({
    commandId: next(),
    householdId,
    itemId,
    outcome: kind,
  });

const listed = async () => (await shopping['shopping.list']({ householdId })).items;

describe('products.setMinStock', () => {
  it('sets and clears the minimum, with an event each time', async () => {
    await add();
    const product = await productOf('Vollmilch');
    await setMin(product.id, 2);
    expect((await productOf('Vollmilch')).minStock).toBe(2);
    await setMin(product.id, null);
    expect((await productOf('Vollmilch')).minStock).toBeUndefined();
    const events = (await storage.events.ofHousehold(householdId)).filter(
      (entry) => entry.type === 'product.min_stock_set',
    );
    expect(events).toHaveLength(2);
  });

  it('refuses 0, 21 and fractions, and an unknown product', async () => {
    await add();
    const product = await productOf('Vollmilch');
    for (const minStock of [0, 21, 1.5, -1]) {
      expect(
        CONTRACT_V1['products.setMinStock'].input.safeParse({
          commandId: next(),
          householdId,
          productId: product.id,
          minStock,
        }).success,
      ).toBe(false);
    }
    await expect(setMin(id(99), 1)).rejects.toBeInstanceOf(CommandError);
  });
});

describe('minimum stock after an outcome', () => {
  it('adds the product once to «Nachkaufen» when the last pack is settled', async () => {
    const { itemId } = await add();
    await setMin((await productOf('Vollmilch')).id, 1);
    const result = await outcome(itemId);
    expect(result.addedToList).toBe(true);
    const items = await listed();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: 'Vollmilch', source: 'min_stock', checked: false });
    const row = (await storage.shoppingItems.ofHousehold(householdId))[0];
    expect(row?.productId).toBe((await productOf('Vollmilch')).id);
    expect(row?.categoryId).toBe((await productOf('Vollmilch')).categoryId);
    const added = (await storage.events.ofHousehold(householdId)).filter(
      (entry) => entry.type === 'shopping_list.item_added',
    );
    expect(added).toHaveLength(1);
  });

  it('works for wasted food and says nothing while enough packs are left', async () => {
    const first = await add();
    const second = await add();
    await setMin((await productOf('Vollmilch')).id, 2);
    const stillEnough = await inventory['inventory.recordOutcome']({
      commandId: next(),
      householdId,
      itemId: first.itemId,
      outcome: 'wasted',
    });
    // One pack left, minimum two: below it already.
    expect(stillEnough.addedToList).toBe(true);
    const again = await outcome(second.itemId, 'wasted');
    expect(again.addedToList).toBeUndefined();
    expect(await listed()).toHaveLength(1);
  });

  it('does not add a second row when the product is open on the list already', async () => {
    const { itemId } = await add();
    await setMin((await productOf('Vollmilch')).id, 1);
    await shopping['shopping.addItem']({ commandId: next(), householdId, name: 'vollmilch' });
    const result = await outcome(itemId);
    expect(result.addedToList).toBeUndefined();
    expect(await listed()).toHaveLength(1);
    expect((await listed())[0]?.source).toBeUndefined();
  });

  it('adds again when the earlier row is checked off', async () => {
    const first = await add();
    await setMin((await productOf('Vollmilch')).id, 1);
    await outcome(first.itemId);
    const [row] = await listed();
    await shopping['shopping.check']({
      commandId: next(),
      householdId,
      itemId: row?.id ?? id(99),
      checked: true,
    });
    const second = await add();
    expect((await outcome(second.itemId)).addedToList).toBe(true);
    expect(await shopping['shopping.list']({ householdId, includeChecked: true })).toMatchObject({
      items: [{}, {}],
    });
  });

  it('does nothing without a minimum', async () => {
    const { itemId } = await add();
    const result = await outcome(itemId);
    expect(result.addedToList).toBeUndefined();
    expect(await listed()).toHaveLength(0);
  });

  it('does not remove the row again on an undo', async () => {
    const { itemId } = await add();
    await setMin((await productOf('Vollmilch')).id, 1);
    const { eventId } = await outcome(itemId);
    await inventory['inventory.undoOutcome']({ commandId: next(), householdId, eventId });
    expect(await listed()).toHaveLength(1);
  });

  it('also triggers for the ingredients of «Verarbeiten»', async () => {
    const milk = await add();
    const flour = await add('Mehl');
    await setMin((await productOf('Vollmilch')).id, 1);
    await inventory['inventory.process']({
      commandId: next(),
      householdId,
      ingredients: [{ itemId: milk.itemId }, { itemId: flour.itemId }],
      result: { name: 'Pfannkuchen', kind: 'made', location: 'fridge' },
    });
    const items = await listed();
    expect(items.map((entry) => entry.name)).toEqual(['Vollmilch']);
  });
});

describe('export and import of the minimum stock (ADR-0020)', () => {
  it('keeps minStock and source through JSON and the import schema', async () => {
    await storage.households.add({
      id: householdId,
      updatedAt: now,
      name: 'WG',
      plan: 'free',
      createdAt: now,
    });
    await storage.members.put({
      id: actor,
      householdId,
      updatedAt: now,
      displayName: 'A',
      role: 'owner',
      joinedAt: now,
    });
    const { itemId } = await add();
    await setMin((await productOf('Vollmilch')).id, 3);
    await outcome(itemId);
    const exported = await household['household.export']({ householdId });
    expect(exported.products[0]?.minStock).toBe(3);
    expect(exported.shoppingItems[0]?.source).toBe('min_stock');
    const roundTrip = JSON.parse(JSON.stringify(exported)) as unknown;
    const parsed = HouseholdExportSchema.parse(roundTrip);
    expect(parsed.products[0]?.minStock).toBe(3);
    expect(parsed.shoppingItems[0]?.source).toBe('min_stock');
    expect(
      CONTRACT_V1['household.import'].input.safeParse({
        commandId: id(50),
        householdId,
        confirm: true,
        data: roundTrip,
      }).success,
    ).toBe(true);
  });
});
