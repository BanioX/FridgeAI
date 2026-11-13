import { beforeEach, describe, expect, it } from 'vitest';
import {
  createMemoryStorage,
  createShoppingUseCases,
  InventoryItemSchema,
  IsoDateTimeSchema,
  localDate,
  ProductSchema,
  uuidV7,
  type Id,
  type InventoryItem,
  type Storage,
} from '../src';

/** `shopping.suggestions` (ADR-0070) on memory storage: the history comes from all items. */
let storage: Storage;
let shopping: ReturnType<typeof createShoppingUseCases>;
let counter: number;
const householdId = id(1);
const actor = id(2);
const now = IsoDateTimeSchema.parse('2026-11-13T09:00:00.000Z');

function id(n: number): Id {
  const random = new Uint8Array(10);
  random[9] = n % 256;
  random[8] = Math.floor(n / 256);
  return uuidV7(1_762_500_000_000 + n, random);
}
const next = () => id((counter += 1));

beforeEach(() => {
  counter = 10;
  storage = createMemoryStorage();
  shopping = createShoppingUseCases({
    storage,
    clock: { now: () => now, today: () => localDate('2026-11-13') },
    ids: { next },
    actor,
  });
});

async function product(name: string, minStock?: number): Promise<Id> {
  const row = ProductSchema.parse({
    id: next(),
    householdId,
    updatedAt: now,
    name,
    categoryId: 'dairy-milk',
    defaultLocation: 'fridge',
    source: 'manual',
    ...(minStock === undefined ? {} : { minStock }),
  });
  await storage.products.add(row);
  return row.id;
}

async function pack(productId: Id, day: string, extra: Partial<InventoryItem> = {}): Promise<void> {
  await storage.items.add(
    InventoryItemSchema.parse({
      id: next(),
      householdId,
      updatedAt: now,
      productId,
      location: 'fridge',
      quantity: 1,
      unit: 'pcs',
      purchasedAt: `${day}T11:00:00.000Z`,
      expiresOn: '2026-11-30',
      expiryKind: 'best_before',
      expirySource: 'manual',
      owner: 'shared',
      status: 'eaten',
      ...extra,
    }),
  );
}

/** Bought on 1., 4. and 7.11. and all used up: usual day 10.11. */
async function usedUpMilk(): Promise<Id> {
  const milk = await product('Vollmilch');
  for (const day of ['2026-11-01', '2026-11-04', '2026-11-07']) {
    await pack(milk, day);
  }
  return milk;
}

const suggested = async () => (await shopping['shopping.suggestions']({ householdId })).suggestions;

describe('shopping.suggestions', () => {
  it('learns the rhythm from used-up packs and suggests the product', async () => {
    const milk = await usedUpMilk();
    expect(await suggested()).toEqual([
      { productId: milk, name: 'Vollmilch', everyDays: 3, lastBought: '2026-11-07' },
    ]);
  });

  it('stays quiet while an open pack is at home', async () => {
    const milk = await usedUpMilk();
    await pack(milk, '2026-11-12', { status: 'active' });
    expect(await suggested()).toEqual([]);
  });

  it('does not count deleted packs as purchases or as stock', async () => {
    const milk = await usedUpMilk();
    await pack(milk, '2026-11-12', { status: 'active', deletedAt: now });
    expect(await suggested()).toHaveLength(1);
    const cheese = await product('Käse');
    await pack(cheese, '2026-11-01');
    await pack(cheese, '2026-11-04');
    await pack(cheese, '2026-11-07', { deletedAt: now });
    expect(await suggested()).toHaveLength(1);
  });

  it('skips products already on the list, open or ticked (ticked ones are in the basket)', async () => {
    await usedUpMilk();
    const { itemId } = await shopping['shopping.addItem']({
      commandId: next(),
      householdId,
      name: 'Vollmilch',
    });
    expect(await suggested()).toEqual([]);
    await shopping['shopping.check']({
      commandId: next(),
      householdId,
      itemId,
      checked: true,
    });
    expect(await suggested()).toEqual([]);
  });

  it('skips products with a minimum stock', async () => {
    const milk = await product('Vollmilch', 1);
    for (const day of ['2026-11-01', '2026-11-04', '2026-11-07']) {
      await pack(milk, day);
    }
    expect(await suggested()).toEqual([]);
  });

  it('is empty without history', async () => {
    expect(await suggested()).toEqual([]);
  });
});
