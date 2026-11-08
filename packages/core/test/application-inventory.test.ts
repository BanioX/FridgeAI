import { beforeEach, describe, expect, it } from 'vitest';
import {
  CommandError,
  createHouseholdUseCases,
  createInventoryUseCases,
  createMemoryStorage,
  GtinSchema,
  HouseholdSchema,
  IsoDateTimeSchema,
  localDate,
  uuidV7,
  type Id,
  type Storage,
} from '../src';

/**
 * The inventory use cases on memory storage: no browser, no database (ADR-0034). The same use
 * cases on IndexedDB: apps/web/src/data/handlers.test.ts.
 */
let storage: Storage;
let inventory: ReturnType<typeof createInventoryUseCases>;
let next: () => Id;
const householdId = id(1);
const actor = id(2);
const now = IsoDateTimeSchema.parse('2026-11-07T09:00:00.000Z');
const gtin = GtinSchema.parse('7610000000011');

function id(counter: number): Id {
  const random = new Uint8Array(10);
  random[9] = counter;
  return uuidV7(1_762_500_000_000 + counter, random);
}

function setup(caches?: Parameters<typeof createMemoryStorage>[0]) {
  let counter = 10;
  next = () => id((counter += 1));
  storage = createMemoryStorage(caches);
  const ctx = {
    storage,
    clock: { now: () => now, today: () => localDate('2026-11-07') },
    ids: { next },
    actor,
  };
  inventory = createInventoryUseCases(ctx);
  return ctx;
}

beforeEach(() => {
  setup();
});

const add = (fields: Record<string, unknown> = {}, commandId = next()) =>
  inventory['inventory.addItem']({
    commandId,
    householdId,
    name: 'Vollmilch',
    location: 'fridge',
    ...fields,
  });

describe('inventory.addItem', () => {
  it('estimates the expiry date and writes an event', async () => {
    const { itemId, expiresOn } = await add();
    expect(expiresOn >= '2026-11-07').toBe(true);
    expect((await storage.items.get(itemId))?.status).toBe('active');
    expect((await storage.events.ofHousehold(householdId)).map((e) => e.type)).toEqual([
      'item.added',
    ]);
  });

  it('is idempotent: the same commandId never creates a second item', async () => {
    const commandId = next();
    const first = await add({}, commandId);
    const second = await add({}, commandId);
    expect(second).toEqual(first);
    expect(await storage.items.ofHousehold(householdId)).toHaveLength(1);
  });

  it('takes facts from the device cache for a known barcode', async () => {
    setup({ productFacts: { [gtin]: { gtin, name: 'Milch', brand: 'Alpen', source: 'off' } } });
    const { itemId } = await add({ gtin });
    const item = await storage.items.get(itemId);
    const product = item && (await storage.products.get(item.productId));
    expect(product).toMatchObject({ source: 'off', brand: 'Alpen', gtin });
    expect(product?.name).toBe('Vollmilch');
  });
});

describe('outcomes', () => {
  it('counts «gerettet» only when confirmed and the food was on the brink (ADR-0039)', async () => {
    const eat = (itemId: Id, rescued: boolean) =>
      inventory['inventory.recordOutcome']({
        commandId: next(),
        householdId,
        itemId,
        outcome: 'eaten',
        rescued,
      });
    // Bread for tomorrow, eaten today: never a rescue, even if ticked.
    const bread = await add({ name: 'Ruchbrot', expiresOn: '2026-11-08' });
    expect((await eat(bread.itemId, true)).rescued).toBe(false);
    // Yoghurt past its best-before date: a rescue once confirmed …
    const yoghurt = await add({ name: 'Joghurt', expiresOn: '2026-11-05' });
    const saved = await eat(yoghurt.itemId, true);
    expect(saved.rescued).toBe(true);
    expect((await storage.outcomes.get(saved.eventId))?.rescued).toBe(true);
    // Its value comes back for «Gerettet: Joghurt, etwa CHF …» (ADR-0042): no price, an estimate.
    expect(saved.valueRappen).toBeGreaterThan(0);
    expect(saved.valueEstimated).toBe(true);
    const priced = await add({ name: 'Mozzarella', expiresOn: '2026-11-05', priceRappen: 210 });
    expect(await eat(priced.itemId, true)).toMatchObject({
      rescued: true,
      valueRappen: 210,
      valueEstimated: false,
    });
    // … and none without the confirmation.
    const quark = await add({ name: 'Quark', expiresOn: '2026-11-06' });
    expect((await eat(quark.itemId, false)).rescued).toBe(false);
    // Thrown away after all: no longer a rescue.
    await inventory['inventory.changeOutcome']({
      commandId: next(),
      householdId,
      eventId: saved.eventId,
      outcome: 'wasted',
    });
    expect((await storage.outcomes.get(saved.eventId))?.rescued).toBeUndefined();
  });

  it('records an outcome, closes the item and undoes it again', async () => {
    const { itemId } = await add({ quantity: 2, unit: 'pcs' });
    const done = await inventory['inventory.recordOutcome']({
      commandId: next(),
      householdId,
      itemId,
      outcome: 'eaten',
    });
    expect(done.remainingQuantity).toBe(0);
    expect((await storage.items.get(itemId))?.status).toBe('eaten');
    await expect(
      inventory['inventory.recordOutcome']({
        commandId: next(),
        householdId,
        itemId,
        outcome: 'eaten',
      }),
    ).rejects.toMatchObject({ code: 'not_active' });

    const undone = await inventory['inventory.undoOutcome']({
      commandId: next(),
      householdId,
      eventId: done.eventId,
    });
    expect(undone).toEqual({ itemId, quantity: 2 });
    expect((await storage.items.get(itemId))?.status).toBe('active');
    await expect(
      inventory['inventory.undoOutcome']({ commandId: next(), householdId, eventId: done.eventId }),
    ).rejects.toBeInstanceOf(CommandError);
    const stats = await inventory['stats.waste']({
      householdId,
      from: localDate('2026-11-01'),
      to: localDate('2026-11-30'),
    });
    expect(stats.savedCount + stats.wastedCount).toBe(0);
  });
});

describe('queries', () => {
  it('lists what expires soon, sorted by date', async () => {
    await add({ name: 'Joghurt', expiresOn: '2026-11-09' });
    await add({ name: 'Butter', expiresOn: '2026-11-08' });
    await add({ name: 'Käse', expiresOn: '2026-12-30' });
    const { items } = await inventory['inventory.listExpiring']({ householdId, withinDays: 3 });
    expect(items.map((item) => item.name)).toEqual(['Butter', 'Joghurt']);
    const all = await inventory['inventory.list']({ householdId });
    expect(all.items).toHaveLength(3);
  });

  it('looks up the household product first and serves the cached picture', async () => {
    setup({ productImages: { [gtin]: 'data:image/png;base64,AAAA' } });
    await add({ name: 'Eigene Milch', gtin });
    const found = await inventory['products.lookup']({ householdId, gtin });
    expect(found.product).toMatchObject({ name: 'Eigene Milch', source: 'household' });
    expect(await inventory['products.image']({ householdId, gtin })).toEqual({
      image: { dataUrl: 'data:image/png;base64,AAAA', source: 'off' },
    });
  });
});

describe('household.export', () => {
  it('hands out everything of the household, deleted rows included', async () => {
    await storage.households.add(
      HouseholdSchema.parse({
        id: householdId,
        updatedAt: now,
        name: 'WG',
        plan: 'free',
        createdAt: now,
      }),
    );
    const { itemId } = await add();
    await inventory['inventory.deleteItem']({ commandId: next(), householdId, itemId });
    const exporter = createHouseholdUseCases({
      storage,
      clock: { now: () => now, today: () => localDate('2026-11-07') },
      ids: { next },
      actor,
    });
    const data = await exporter['household.export']({ householdId });
    expect(data.format).toBe('fridgeai-export');
    expect(data.items.map((item) => item.id)).toEqual([itemId]);
    expect(data.items[0]?.deletedAt).toBeDefined();
    expect(data.events.length).toBeGreaterThan(1);
    await expect(exporter['household.export']({ householdId: id(99) })).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});
