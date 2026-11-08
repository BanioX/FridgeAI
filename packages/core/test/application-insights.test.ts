import { beforeEach, describe, expect, it } from 'vitest';
import {
  createInventoryUseCases,
  createMemoryStorage,
  IsoDateTimeSchema,
  localDate,
  rappen,
  uuidV7,
  type Id,
  type Storage,
} from '../src';

/**
 * Usual products, price memory and the report on memory storage: no browser (ADR-0034). The
 * same queries on IndexedDB, with more cases: apps/web/src/data/*.dexie.test.ts.
 */
let storage: Storage;
let inventory: ReturnType<typeof createInventoryUseCases>;
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
  inventory = createInventoryUseCases({
    storage,
    clock: { now: () => now, today: () => localDate('2026-11-07') },
    ids: { next },
    actor,
  });
});

const add = (name: string, quantity = 1) =>
  inventory['inventory.addItem']({
    commandId: next(),
    householdId,
    name,
    location: 'fridge',
    quantity,
  });

describe('insight queries on memory storage', () => {
  it('products.frequent ranks by additions and restores the eaten amount', async () => {
    await add('Ruchbrot');
    await add('Vollmilch');
    const { itemId } = await add('Vollmilch', 2);
    await inventory['inventory.recordOutcome']({
      commandId: next(),
      householdId,
      itemId,
      outcome: 'eaten',
      quantity: 1,
    });
    const { products } = await inventory['products.frequent']({ householdId, limit: 5 });
    expect(products.map((product) => [product.name, product.timesAdded])).toEqual([
      ['Vollmilch', 2],
      ['Ruchbrot', 1],
    ]);
    expect(products[0]?.quantity).toBe(2);
  });

  it('prices.memory reads receipt lines, net of discounts, matched by name', async () => {
    const receiptId = next();
    await storage.receipts.add({
      id: receiptId,
      householdId,
      updatedAt: now,
      retailer: 'coop',
      purchasedAt: now,
      totalRappen: rappen(150),
      source: 'pdf',
      hash: 'a'.repeat(64),
      createdBy: actor,
    });
    await storage.receiptLines.add({
      id: next(),
      householdId,
      updatedAt: now,
      receiptId,
      position: 0,
      rawText: 'Vollmilch 1L 1.0 1.80',
      name: 'Vollmilch 1L',
      kind: 'item',
      isFood: true,
      quantity: 1,
      unit: 'pcs',
      priceRappen: rappen(180),
      discountRappen: rappen(-30),
      assignedTo: 'shared',
      includedInInventory: true,
    });
    const { products } = await inventory['prices.memory']({
      householdId,
      names: ['vollmilch 1l', 'Rahm'],
    });
    expect(products[0]).toMatchObject({
      name: 'vollmilch 1l',
      count: 1,
      last: { retailer: 'coop', paidRappen: 150, promotion: true },
    });
    expect(products[1]).toEqual({ name: 'Rahm', count: 0 });
  });

  it('reports.build counts the stock and the receipts', async () => {
    await add('Vollmilch');
    await add('Joghurt', 4);
    const report = await inventory['reports.build']({
      householdId,
      from: localDate('2026-11-01'),
      to: localDate('2026-11-07'),
    });
    expect(report.fridge.itemCount).toBe(2);
    expect(report.fridge.valueRappen).toBeGreaterThan(0);
    expect(report.shopping.receiptCount).toBe(0);
  });

  /** An item that came from a receipt of `retailer` (line and receipt written like the import). */
  async function addBought(name: string, retailer: 'coop' | 'other', deleted = false): Promise<Id> {
    const { itemId } = await add(name);
    const receiptId = next();
    const lineId = next();
    await storage.receipts.add({
      id: receiptId,
      householdId,
      updatedAt: now,
      retailer,
      purchasedAt: now,
      totalRappen: rappen(150),
      source: 'pdf',
      hash: 'b'.repeat(64),
      createdBy: actor,
      ...(deleted ? { deletedAt: now } : {}),
    });
    await storage.receiptLines.add({
      id: lineId,
      householdId,
      updatedAt: now,
      receiptId,
      position: 0,
      rawText: name,
      name,
      kind: 'item',
      isFood: true,
      quantity: 1,
      unit: 'pcs',
      priceRappen: rappen(150),
      discountRappen: rappen(0),
      assignedTo: 'shared',
      includedInInventory: true,
    });
    const item = await storage.items.get(itemId);
    if (item === undefined) {
      throw new Error('item missing');
    }
    await storage.items.put({ ...item, receiptLineId: lineId });
    return itemId;
  }

  it('shows the shop on items from a receipt, in the list and in the report', async () => {
    const coop = await addBought('Vollmilch', 'coop');
    const other = await addBought('Brot', 'other');
    const gone = await addBought('Butter', 'coop', true);
    await add('Joghurt');
    const { items } = await inventory['inventory.list']({ householdId });
    const retailerOf = (id: Id) => items.find((item) => item.id === id)?.retailer;
    expect(retailerOf(coop)).toBe('coop');
    expect(retailerOf(other)).toBeUndefined();
    expect(retailerOf(gone)).toBeUndefined();
    expect(items.filter((item) => item.retailer !== undefined)).toHaveLength(1);

    const report = await inventory['reports.build']({
      householdId,
      from: localDate('2026-11-01'),
      to: localDate('2026-11-07'),
    });
    const shops = Object.fromEntries(report.fridge.items.map((i) => [i.name, i.retailer]));
    expect(shops).toMatchObject({ Vollmilch: 'coop' });
    expect(shops.Brot).toBeUndefined();
    expect(shops.Joghurt).toBeUndefined();
  });

  it('products.wasteHabits names what was thrown away at least twice, with a tip (ADR-0038)', async () => {
    const throwAway = async (name: string, outcome: 'wasted' | 'eaten' = 'wasted') => {
      const { itemId } = await add(name);
      await inventory['inventory.recordOutcome']({
        commandId: next(),
        householdId,
        itemId,
        outcome,
        quantity: 1,
      });
    };
    await throwAway('Hummus Natur');
    await throwAway('Guacamole');
    await throwAway('Tomatenmark');
    await throwAway('Pesto', 'eaten');
    const { habits } = await inventory['products.wasteHabits']({ householdId });
    // Dips twice: a habit. Tomato paste once and pesto eaten: not (yet).
    expect(habits).toHaveLength(1);
    expect(habits[0]).toMatchObject({
      categoryId: 'prepared-dips',
      times: 2,
      lastOn: '2026-11-07',
    });
    // Same clock here, so no order to check; newest first is tested in waste-habits.test.ts.
    expect([...(habits[0]?.names ?? [])].sort()).toEqual(['Guacamole', 'Hummus Natur']);
    expect(habits[0]?.tip).toMatch(/kleine Packung/);
  });
});
