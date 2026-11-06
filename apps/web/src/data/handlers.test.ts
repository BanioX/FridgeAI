import 'fake-indexeddb/auto';
import { GtinSchema, inMemoryCatalog, localDate, rappen, type Id } from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import type { FridgeDb } from './db';
import { CommandError, createInventoryHandlers, type InventoryHandlers } from './handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

let db: FridgeDb;
let handlers: InventoryHandlers;
let householdId: Id;
let ids: ReturnType<typeof sequentialIds>;

beforeEach(async () => {
  db = testDb();
  ids = sequentialIds();
  const clock = fixedClock('2026-11-06T09:00:00.000Z', '2026-11-06');
  const profile = await ensureLocalHousehold(db, clock, ids, { household: 'WG', member: 'Lena' });
  householdId = profile.household.id;
  handlers = createInventoryHandlers({ db, clock, ids, actor: profile.member.id });
});

const add = (fields: Record<string, unknown>) =>
  handlers['inventory.addItem']({
    commandId: ids.next(),
    householdId,
    name: 'Vollmilch',
    location: 'fridge',
    ...fields,
  });

async function productOf(itemId: Id) {
  const item = await db.items.get(itemId);
  if (item === undefined) {
    throw new Error(`missing item ${itemId}`);
  }
  return db.products.get(item.productId);
}

describe('inventory.addItem', () => {
  it('recognises the category and estimates the expiry date', async () => {
    const { itemId, expiresOn } = await add({});
    expect(expiresOn).toBe('2026-11-13');
    const item = await db.items.get(itemId);
    expect(item).toMatchObject({
      expiryKind: 'best_before',
      expirySource: 'category_estimate',
      owner: 'shared',
      status: 'active',
    });
    const product = await productOf(itemId);
    expect(product).toMatchObject({
      name: 'Vollmilch',
      categoryId: 'dairy-milk',
      source: 'manual',
    });
    expect(await db.events.where('type').equals('item.added').count()).toBe(1);
  });

  it('is idempotent: the same commandId never creates a second item', async () => {
    const commandId = ids.next();
    const input = { commandId, householdId, name: 'Eier', location: 'fridge' } as const;
    const first = await handlers['inventory.addItem'](input);
    const second = await handlers['inventory.addItem'](input);
    expect(second).toEqual(first);
    expect(await db.items.count()).toBe(1);
  });

  it('keeps a typed or scanned date and its kind', async () => {
    const typed = await add({ expiresOn: '2026-11-20' });
    expect(await db.items.get(typed.itemId)).toMatchObject({
      expiresOn: '2026-11-20',
      expirySource: 'manual',
    });
    const scanned = await add({
      name: 'Poulet',
      expiresOn: '2026-11-08',
      expiryKind: 'use_by',
      expirySource: 'gs1_code',
    });
    expect(await db.items.get(scanned.itemId)).toMatchObject({
      expiryKind: 'use_by',
      expirySource: 'gs1_code',
    });
  });

  it('uses the category date kind (Hackfleisch = use by) and freezer rules', async () => {
    const minced = await add({ name: 'Hackfleisch' });
    expect(await db.items.get(minced.itemId)).toMatchObject({ expiryKind: 'use_by' });
    const frozen = await add({ name: 'Erbsen', location: 'freezer' });
    expect(await db.items.get(frozen.itemId)).toMatchObject({
      frozenOn: '2026-11-06',
      expiresOn: '2027-08-03',
    });
  });

  it('reuses an existing product with the same name', async () => {
    await add({ name: 'Vollmilch' });
    await add({ name: '  vollmilch ' });
    expect(await db.products.count()).toBe(1);
    expect(await db.items.count()).toBe(2);
  });

  it('falls back to «Sonstiges» for unknown food', async () => {
    const { itemId } = await add({ name: 'Xylophon-Snack' });
    const product = await productOf(itemId);
    expect(product?.categoryId).toBe('pantry-other');
  });
});

describe('inventory.list and inventory.listExpiring', () => {
  it('lists active items sorted by expiry, optionally per location', async () => {
    await add({ name: 'Butter' });
    await add({ name: 'Hackfleisch' });
    await add({ name: 'Reis', location: 'pantry' });
    const { items } = await handlers['inventory.list']({ householdId });
    expect(items.map((item) => item.name)).toEqual(['Hackfleisch', 'Butter', 'Reis']);
    expect(items[0]).toMatchObject({ emoji: '🍖', categoryId: 'meat-minced' });
    const pantry = await handlers['inventory.list']({ householdId, location: 'pantry' });
    expect(pantry.items.map((item) => item.name)).toEqual(['Reis']);
  });

  it('shows what expires soon, but the Notvorrat only when it needs attention', async () => {
    await add({ name: 'Hackfleisch' }); // tomorrow
    await add({ name: 'Butter' }); // in 45 days
    await add({ name: 'Notration', location: 'reserve', expiresOn: '2027-01-10' }); // in 65 days
    await add({ name: 'Notwasser', location: 'reserve', expiresOn: '2030-01-01' });
    const { items } = await handlers['inventory.listExpiring']({ householdId });
    expect(items.map((item) => [item.name, item.status.kind])).toEqual([
      ['Hackfleisch', 'soon'],
      ['Notration', 'soon'],
    ]);
    const all = await handlers['inventory.listExpiring']({
      householdId,
      withinDays: 3650,
      includeReserve: true,
    });
    expect(all.items).toHaveLength(4);
  });
});

describe('inventory.recordOutcome', () => {
  it('records partial use with a proportional value and keeps the rest', async () => {
    const { itemId } = await add({ name: 'Joghurt', quantity: 4, priceRappen: 380 });
    const result = await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'eaten',
      quantity: 1,
    });
    expect(result.remainingQuantity).toBe(3);
    const outcome = await db.outcomes.get(result.eventId);
    expect(outcome).toMatchObject({ valueRappen: 95, valueEstimated: false, owner: 'shared' });
    expect(await db.items.get(itemId)).toMatchObject({
      quantity: 3,
      status: 'active',
      priceRappen: 285,
    });
    const second = await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'eaten',
      quantity: 1,
    });
    expect(await db.outcomes.get(second.eventId)).toMatchObject({ valueRappen: 95 });
  });

  it('closes the item when everything is used and emits used_up', async () => {
    const { itemId } = await add({ name: 'Vollmilch' });
    const result = await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'wasted',
    });
    expect(result.remainingQuantity).toBe(0);
    expect(await db.items.get(itemId)).toMatchObject({ status: 'wasted' });
    const outcome = await db.outcomes.get(result.eventId);
    expect(outcome).toMatchObject({ valueRappen: rappen(165), valueEstimated: true, grams: 1030 });
    expect(await db.events.where('type').equals('item.used_up').count()).toBe(1);
    await expect(
      handlers['inventory.recordOutcome']({
        commandId: ids.next(),
        householdId,
        itemId,
        outcome: 'eaten',
      }),
    ).rejects.toThrow(CommandError);
  });

  it('rejects unknown items and too large quantities', async () => {
    const { itemId } = await add({ name: 'Eier', quantity: 2 });
    await expect(
      handlers['inventory.recordOutcome']({
        commandId: ids.next(),
        householdId,
        itemId,
        outcome: 'eaten',
        quantity: 3,
      }),
    ).rejects.toMatchObject({ code: 'invalid_quantity' });
    await expect(
      handlers['inventory.recordOutcome']({
        commandId: ids.next(),
        householdId,
        itemId: ids.next(),
        outcome: 'eaten',
      }),
    ).rejects.toMatchObject({ code: 'not_found' });
    expect(await db.outcomes.count()).toBe(0);
  });
});

describe('packaging, opening and reasons', () => {
  it('stores how pieces are packed and shows it in the list', async () => {
    const { itemId } = await add({
      name: 'Joghurt',
      quantity: 2,
      container: 'cup',
      packageSize: { amount: 180, unit: 'g' },
    });
    const { items } = await handlers['inventory.list']({ householdId });
    expect(items.find((view) => view.id === itemId)).toMatchObject({
      quantity: 2,
      container: 'cup',
      packageSize: { amount: 180, unit: 'g' },
    });
  });

  it('applies the opening rule to a pack that is already open when added', async () => {
    const { itemId, expiresOn } = await add({
      name: 'Rahm',
      expiresOn: '2026-11-20',
      openedOn: '2026-11-05',
    });
    expect(expiresOn).toBe('2026-11-08');
    expect(await db.items.get(itemId)).toMatchObject({
      openedOn: '2026-11-05',
      sealedExpiresOn: '2026-11-20',
      expirySource: 'after_opening',
    });
  });

  it('opens a pack: Grana Padano until March keeps 21 days from today', async () => {
    const { itemId } = await add({ name: 'Grana Padano', expiresOn: '2027-03-15' });
    const commandId = ids.next();
    const open = () => handlers['inventory.open']({ commandId, householdId, itemId });
    expect(await open()).toEqual({ expiresOn: '2026-11-27', shortened: true });
    // Same command again (offline retry): same answer, nothing changes twice.
    expect(await open()).toEqual({ expiresOn: '2026-11-27', shortened: true });
    expect(await db.items.get(itemId)).toMatchObject({
      openedOn: '2026-11-06',
      sealedExpiresOn: '2027-03-15',
      expiresOn: '2026-11-27',
      expirySource: 'after_opening',
    });
    expect(await db.events.where('type').equals('item.opened').count()).toBe(1);
    const { items } = await handlers['inventory.list']({ householdId });
    expect(items.find((view) => view.id === itemId)?.openedOn).toBe('2026-11-06');
    await expect(
      handlers['inventory.open']({ commandId: ids.next(), householdId, itemId }),
    ).rejects.toMatchObject({ code: 'already_open' });
  });

  it('lets the label override the category rule, and never extends the date', async () => {
    const { itemId } = await add({ name: 'Grana Padano', expiresOn: '2027-03-15' });
    const result = await handlers['inventory.open']({
      commandId: ids.next(),
      householdId,
      itemId,
      afterOpeningDays: 3,
    });
    expect(result.expiresOn).toBe('2026-11-09');
    const { itemId: soon } = await add({ name: 'Grana Padano', expiresOn: '2026-11-08' });
    expect(
      await handlers['inventory.open']({ commandId: ids.next(), householdId, itemId: soon }),
    ).toEqual({ expiresOn: '2026-11-08', shortened: false });
  });

  it('records why food was thrown away and who got shared food', async () => {
    const { itemId } = await add({ name: 'Joghurt', quantity: 4 });
    const wasted = await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'wasted',
      quantity: 1,
      wasteReason: 'forgotten',
    });
    expect(await db.outcomes.get(wasted.eventId)).toMatchObject({ wasteReason: 'forgotten' });
    const shared = await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'shared_out',
      quantity: 1,
      sharedWith: 'neighbor',
    });
    expect(await db.outcomes.get(shared.eventId)).toMatchObject({ sharedWith: 'neighbor' });
    const consumed = await db.events.where('type').equals('item.consumed').toArray();
    expect(consumed.map((e) => e.type === 'item.consumed' && e.payload)).toMatchObject([
      { wasteReason: 'forgotten' },
      { sharedWith: 'neighbor' },
    ]);
    await expect(
      handlers['inventory.recordOutcome']({
        commandId: ids.next(),
        householdId,
        itemId,
        outcome: 'eaten',
        wasteReason: 'expired',
      }),
    ).rejects.toThrow(/waste reason/);
  });
});

describe('inventory.move', () => {
  it('freezes and thaws with new estimated dates', async () => {
    const { itemId } = await add({
      name: 'Pouletbrust',
      expiresOn: '2026-11-08',
      expirySource: 'manual',
    });
    const frozen = await handlers['inventory.move']({
      commandId: ids.next(),
      householdId,
      itemId,
      to: 'freezer',
    });
    expect(frozen.expiresOn).toBe('2027-04-05');
    expect(await db.items.get(itemId)).toMatchObject({
      location: 'freezer',
      frozenOn: localDate('2026-11-06'),
      expirySource: 'category_estimate',
    });
    const thawed = await handlers['inventory.move']({
      commandId: ids.next(),
      householdId,
      itemId,
      to: 'fridge',
    });
    expect(thawed.expiresOn).toBe('2026-11-07');
    expect((await db.items.get(itemId))?.frozenOn).toBeUndefined();
    expect(await db.events.where('type').equals('item.moved').count()).toBe(2);
  });

  it('refuses locations that do not suit the food', async () => {
    const { itemId } = await add({ name: 'Brot', location: 'pantry' });
    await expect(
      handlers['inventory.move']({ commandId: ids.next(), householdId, itemId, to: 'fridge' }),
    ).rejects.toMatchObject({ code: 'unsuitable_location' });
  });
});

describe('products.lookup', () => {
  const gtin = GtinSchema.parse('7610000000004');

  it('finds a product the household already has, by barcode', async () => {
    await add({ name: 'Bio Vollmilch', gtin });
    const { product } = await handlers['products.lookup']({ householdId, gtin });
    expect(product).toMatchObject({
      name: 'Bio Vollmilch',
      categoryId: 'dairy-milk',
      source: 'household',
    });
  });

  it('asks the open database for unknown barcodes and maps the category from the name', async () => {
    const withCatalog = createInventoryHandlers({
      db,
      clock: fixedClock('2026-11-06T09:00:00.000Z', '2026-11-06'),
      ids,
      actor: ids.next(),
      catalog: inMemoryCatalog([
        { gtin, name: 'Vollmilch', brand: 'Alpenhof', packSize: '1 l', source: 'off' },
      ]),
    });
    const { product } = await withCatalog['products.lookup']({ householdId, gtin });
    expect(product).toEqual({
      name: 'Vollmilch',
      brand: 'Alpenhof',
      packSize: '1 l',
      categoryId: 'dairy-milk',
      source: 'off',
    });
  });

  it('returns null without a catalog or when nobody knows the code', async () => {
    expect(await handlers['products.lookup']({ householdId, gtin })).toEqual({ product: null });
  });
});
