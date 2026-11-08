import 'fake-indexeddb/auto';
import { GtinSchema, inMemoryCatalog, localDate, rappen, type Id } from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import { cachedCatalog } from './catalog-cache';
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

describe('inventory.updateItem', () => {
  const update = (itemId: Id, fields: Record<string, unknown>) =>
    handlers['inventory.updateItem']({ commandId: ids.next(), householdId, itemId, ...fields });

  it('corrects date, kind, quantity and price; a typed date is manual', async () => {
    const { itemId } = await add({ name: 'Joghurt', quantity: 4 });
    const result = await update(itemId, {
      expiresOn: localDate('2026-11-25'),
      expiryKind: 'use_by',
      quantity: 6,
      priceRappen: 450,
    });
    expect(result.changed).toEqual(['expiresOn', 'expiryKind', 'quantity', 'priceRappen']);
    expect(await db.items.get(itemId)).toMatchObject({
      expiresOn: '2026-11-25',
      expirySource: 'manual',
      expiryKind: 'use_by',
      quantity: 6,
      priceRappen: 450,
    });
    const events = await db.events.where('type').equals('item.updated').toArray();
    expect(events.map((event) => event.payload)).toEqual([
      { itemId, fields: ['expiresOn', 'expiryKind', 'quantity', 'priceRappen'] },
    ]);
  });

  it('writes nothing when nothing changes and can remove a wrong price', async () => {
    const { itemId, expiresOn } = await add({ name: 'Joghurt', quantity: 4, priceRappen: 380 });
    expect((await update(itemId, { expiresOn, quantity: 4 })).changed).toEqual([]);
    expect(await db.events.where('type').equals('item.updated').count()).toBe(0);
    expect((await db.items.get(itemId))?.expirySource).toBe('category_estimate');

    expect((await update(itemId, { priceRappen: null })).changed).toEqual(['priceRappen']);
    expect((await db.items.get(itemId))?.priceRappen).toBeUndefined();
  });

  it('refuses empty changes and closed items', async () => {
    const { itemId } = await add({ name: 'Vollmilch' });
    await expect(update(itemId, {})).rejects.toThrow();
    await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'eaten',
    });
    await expect(update(itemId, { quantity: 2 })).rejects.toMatchObject({ code: 'not_active' });
  });
});

describe('corrections: name, category, place, delete', () => {
  const update = (itemId: Id, fields: Record<string, unknown>) =>
    handlers['inventory.updateItem']({ commandId: ids.next(), householdId, itemId, ...fields });
  const view = async (itemId: Id) =>
    (await handlers['inventory.list']({ householdId })).items.find((item) => item.id === itemId);

  it('fixes a typo in place and re-estimates an estimated date for a new category', async () => {
    const { itemId } = await add({ name: 'Apfle', categoryId: 'pantry-other', location: 'fridge' });
    const before = await db.items.get(itemId);
    await expect(update(itemId, { categoryId: 'no-such-category' })).rejects.toMatchObject({
      code: 'unknown_category',
    });
    const result = await update(itemId, { name: 'Apfel', categoryId: 'produce-apples' });
    expect(result.changed).toEqual(['name', 'categoryId', 'expiresOn']);
    const item = await db.items.get(itemId);
    expect(item?.productId).toBe(before?.productId);
    expect(await view(itemId)).toMatchObject({ name: 'Apfel', categoryId: 'produce-apples' });
    expect(item?.expiresOn).not.toBe(before?.expiresOn);
  });

  it('re-links to a known product, or splits off when another item shares the product', async () => {
    const milk = await add({ name: 'Vollmilch' });
    const second = await add({ name: 'Vollmilch' });
    const yoghurt = await add({ name: 'Joghurt' });
    // The second milk was really a yoghurt: it joins the yoghurt product.
    await update(second.itemId, {
      name: 'Joghurt',
      categoryId: (await view(yoghurt.itemId))?.categoryId,
    });
    expect((await db.items.get(second.itemId))?.productId).toBe(
      (await db.items.get(yoghurt.itemId))?.productId,
    );
    // The first milk is now alone with its product: renamed in place.
    const third = await add({ name: 'Vollmilch' });
    await update(third.itemId, { name: 'Hafermilch' });
    expect((await view(milk.itemId))?.name).toBe('Vollmilch');
    expect((await view(third.itemId))?.name).toBe('Hafermilch');
    expect((await db.items.get(third.itemId))?.productId).not.toBe(
      (await db.items.get(milk.itemId))?.productId,
    );
  });

  it('moves to the right place without changing the date', async () => {
    const { itemId, expiresOn } = await add({ name: 'Ruchbrot', location: 'fridge' });
    expect((await update(itemId, { location: 'pantry' })).changed).toEqual(['location']);
    expect(await db.items.get(itemId)).toMatchObject({ location: 'pantry', expiresOn });
  });

  it('deletes without counting as wasted and brings the item back', async () => {
    const { itemId } = await add({ name: 'Joghurt', quantity: 4, priceRappen: 380 });
    const del = () =>
      handlers['inventory.deleteItem']({ commandId: ids.next(), householdId, itemId });
    expect(await del()).toEqual({ itemId });
    expect(await view(itemId)).toBeUndefined();
    expect(await db.outcomes.count()).toBe(0);
    const stats = await handlers['stats.waste']({
      householdId,
      from: localDate('2026-11-01'),
      to: localDate('2026-11-30'),
    });
    expect(stats.wastedRappen).toBe(0);
    await expect(del()).rejects.toMatchObject({ code: 'not_found' });

    await handlers['inventory.restoreItem']({ commandId: ids.next(), householdId, itemId });
    expect(await view(itemId)).toMatchObject({ name: 'Joghurt', quantity: 4 });
    const types = (await db.events.toArray()).map((event) => event.type);
    expect(types).toEqual(expect.arrayContaining(['item.deleted', 'item.restored']));
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

describe('inventory.undoOutcome', () => {
  const record = (itemId: Id, outcome: 'eaten' | 'wasted', quantity?: number) =>
    handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome,
      ...(quantity === undefined ? {} : { quantity }),
    });
  const undo = (eventId: Id, commandId: Id = ids.next()) =>
    handlers['inventory.undoOutcome']({ commandId, householdId, eventId });

  it('gives a partial use back with its price and stops counting it', async () => {
    const { itemId } = await add({ name: 'Joghurt', quantity: 4, priceRappen: 380 });
    const { eventId } = await record(itemId, 'eaten', 1);
    const commandId = ids.next();
    expect(await undo(eventId, commandId)).toEqual({ itemId, quantity: 4 });
    expect(await undo(eventId, commandId)).toEqual({ itemId, quantity: 4 });
    expect(await db.items.get(itemId)).toMatchObject({
      quantity: 4,
      status: 'active',
      priceRappen: 380,
    });
    expect((await db.outcomes.get(eventId))?.deletedAt).toBeDefined();
    const stats = await handlers['stats.waste']({
      householdId,
      from: localDate('2026-11-01'),
      to: localDate('2026-11-30'),
    });
    expect(stats.savedRappen).toBe(0);
    expect(await db.events.where('type').equals('outcome.undone').count()).toBe(1);
    await expect(undo(eventId)).rejects.toMatchObject({ code: 'already_undone' });
  });

  it('reopens a closed item, also for an earlier outcome', async () => {
    const { itemId } = await add({ name: 'Joghurt', quantity: 4, priceRappen: 380 });
    const first = await record(itemId, 'eaten', 1);
    const last = await record(itemId, 'wasted');
    expect(await db.items.get(itemId)).toMatchObject({ status: 'wasted' });

    expect(await undo(first.eventId)).toEqual({ itemId, quantity: 1 });
    expect(await db.items.get(itemId)).toMatchObject({
      status: 'active',
      quantity: 1,
      priceRappen: 95,
    });
    expect(await undo(last.eventId)).toEqual({ itemId, quantity: 4 });
    expect(await db.items.get(itemId)).toMatchObject({ quantity: 4, priceRappen: 380 });
  });

  it('keeps estimated values off the item and rejects unknown outcomes', async () => {
    const { itemId } = await add({ name: 'Vollmilch' });
    const { eventId } = await record(itemId, 'wasted');
    await undo(eventId);
    const item = await db.items.get(itemId);
    expect(item).toMatchObject({ status: 'active', quantity: 1 });
    expect(item?.priceRappen).toBeUndefined();
    await expect(undo(ids.next())).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('inventory.history', () => {
  const november = () => ({
    householdId,
    from: localDate('2026-11-01'),
    to: localDate('2026-11-30'),
  });

  it('lists what was eaten and wasted, newest first, with the share of the price', async () => {
    const { itemId } = await add({
      name: 'Grana Padano',
      quantity: 300,
      unit: 'g',
      priceRappen: 600,
    });
    await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'eaten',
      quantity: 150,
    });
    const wasted = await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'wasted',
      wasteReason: 'forgotten',
    });
    const { outcomes } = await handlers['inventory.history'](november());
    expect(outcomes).toHaveLength(2);
    // Half of 300 g for CHF 6.00 is CHF 3.00 each way.
    expect(outcomes.map((entry) => [entry.outcome, entry.quantity, entry.valueRappen])).toEqual(
      expect.arrayContaining([
        ['eaten', 150, 300],
        ['wasted', 150, 300],
      ]),
    );
    expect(outcomes.find((entry) => entry.eventId === wasted.eventId)).toMatchObject({
      itemId,
      name: 'Grana Padano',
      unit: 'g',
      wasteReason: 'forgotten',
      valueEstimated: false,
    });
    expect((outcomes[0]?.at ?? '') >= (outcomes[1]?.at ?? '')).toBe(true);

    await handlers['inventory.undoOutcome']({
      commandId: ids.next(),
      householdId,
      eventId: wasted.eventId,
    });
    expect((await handlers['inventory.history'](november())).outcomes).toHaveLength(1);
    expect(
      (
        await handlers['inventory.history']({
          householdId,
          from: localDate('2026-10-01'),
          to: localDate('2026-10-31'),
        })
      ).outcomes,
    ).toEqual([]);
  });

  it('removes the entry of an item deleted later, so statistics no longer count it', async () => {
    const { itemId } = await add({ name: 'Joghurt', quantity: 4, priceRappen: 400 });
    const { eventId } = await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'wasted',
      quantity: 1,
    });
    await handlers['inventory.deleteItem']({ commandId: ids.next(), householdId, itemId });
    expect(
      await handlers['inventory.undoOutcome']({ commandId: ids.next(), householdId, eventId }),
    ).toEqual({ itemId, quantity: 0 });
    expect((await db.items.get(itemId))?.deletedAt).toBeDefined();
    expect((await handlers['stats.waste'](november())).wastedRappen).toBe(0);
  });
});

describe('inventory.changeOutcome', () => {
  const november = () => ({
    householdId,
    from: localDate('2026-11-01'),
    to: localDate('2026-11-30'),
  });
  const change = (
    eventId: Id,
    fields: { outcome: 'eaten' | 'wasted'; wasteReason?: 'spoiled' | 'expired' },
  ) =>
    handlers['inventory.changeOutcome']({ commandId: ids.next(), householdId, eventId, ...fields });

  it('turns a wrong «entsorgt» into «verwertet»: value and date stay, the item follows', async () => {
    // Its last day: eaten and confirmed, a rescue (ADR-0039).
    const { itemId } = await add({
      name: 'Joghurt',
      quantity: 4,
      priceRappen: 400,
      expiresOn: '2026-11-06',
    });
    const first = await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'eaten',
      quantity: 1,
      rescued: true,
    });
    const last = await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'wasted',
      wasteReason: 'forgotten',
    });
    const before = await db.outcomes.get(last.eventId);

    expect(await change(last.eventId, { outcome: 'eaten' })).toEqual({
      eventId: last.eventId,
      outcome: 'eaten',
    });
    const after = await db.outcomes.get(last.eventId);
    expect(after).toMatchObject({ outcome: 'eaten', valueRappen: 300, at: before?.at });
    expect(after?.wasteReason).toBeUndefined();
    expect(await db.items.get(itemId)).toMatchObject({ status: 'eaten' });
    // A corrected entry was never confirmed as a rescue: eaten, but not «gerettet».
    expect(await handlers['stats.waste'](november())).toMatchObject({
      savedRappen: 100,
      wastedRappen: 0,
    });

    // An earlier entry does not change the status of the closed item.
    await change(first.eventId, { outcome: 'wasted', wasteReason: 'spoiled' });
    expect(await db.items.get(itemId)).toMatchObject({ status: 'eaten' });
    expect((await db.outcomes.get(first.eventId))?.wasteReason).toBe('spoiled');
    expect(await db.events.where('type').equals('outcome.changed').count()).toBe(2);
  });

  it('rejects unknown, undone and mismatched entries', async () => {
    const { itemId } = await add({ name: 'Milch' });
    const { eventId } = await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'wasted',
    });
    await expect(change(eventId, { outcome: 'eaten', wasteReason: 'expired' })).rejects.toThrow();
    await handlers['inventory.undoOutcome']({ commandId: ids.next(), householdId, eventId });
    await expect(change(eventId, { outcome: 'eaten' })).rejects.toMatchObject({
      code: 'already_undone',
    });
    await expect(change(ids.next(), { outcome: 'eaten' })).rejects.toMatchObject({
      code: 'not_found',
    });
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

  it('keeps the facts of a scanned product on the item, with the name the person chose', async () => {
    const clock = fixedClock('2026-11-06T09:00:00.000Z', '2026-11-06');
    const nutrition = {
      basis: '100ml' as const,
      energyKcal: 64,
      fat: 3.5,
      protein: 3.3,
      source: 'off' as const,
    };
    const withCatalog = createInventoryHandlers({
      db,
      clock,
      ids,
      actor: ids.next(),
      catalog: cachedCatalog(
        db,
        inMemoryCatalog([
          {
            gtin,
            name: 'Vollmilch UHT',
            brand: 'Alpenhof',
            packSize: '1 l',
            nutrition,
            nutriScore: 'b',
            allergens: ['milk'],
            source: 'off',
          },
        ]),
        clock,
      ),
    });
    await withCatalog['products.lookup']({ householdId, gtin });
    const { itemId } = await withCatalog['inventory.addItem']({
      commandId: ids.next(),
      householdId,
      name: 'Milch',
      gtin,
      location: 'fridge',
    });
    const { items } = await withCatalog['inventory.list']({ householdId });
    expect(items.find((item) => item.id === itemId)).toMatchObject({
      name: 'Milch',
      brand: 'Alpenhof',
      packSize: '1 l',
      nutrition,
      nutriScore: 'b',
      allergens: ['milk'],
      productSource: 'off',
    });
    // Known now: the household's product answers the next scan, facts included.
    const again = await withCatalog['products.lookup']({ householdId, gtin });
    expect(again.product).toMatchObject({
      source: 'household',
      factsFrom: 'off',
      brand: 'Alpenhof',
      nutriScore: 'b',
    });
  });

  it('answers with the stored pack picture, and the item names its barcode', async () => {
    expect(await handlers['products.image']({ householdId, gtin })).toEqual({ image: null });
    await db.productImages.put({
      gtin,
      dataUrl: 'data:image/jpeg;base64,/9j/4A==',
      source: 'off',
      fetchedAt: '2026-11-06T09:00:00.000Z',
    });
    expect(await handlers['products.image']({ householdId, gtin })).toEqual({
      image: { dataUrl: 'data:image/jpeg;base64,/9j/4A==', source: 'off' },
    });
    const { itemId } = await add({ name: 'Vollmilch', gtin });
    const { items } = await handlers['inventory.list']({ householdId });
    expect(items.find((item) => item.id === itemId)?.gtin).toBe(gtin);
  });

  it('returns null without a catalog or when nobody knows the code', async () => {
    expect(await handlers['products.lookup']({ householdId, gtin })).toEqual({ product: null });
  });
});

describe('stats.waste', () => {
  it('sums this period: confirmed rescues as rescued, wasted separately', async () => {
    // Its last day: eaten and shared with «Ja, gerettet», a rescue (ADR-0039).
    const { itemId } = await add({
      name: 'Joghurt',
      quantity: 4,
      priceRappen: 400,
      expiresOn: '2026-11-06',
    });
    for (const outcome of ['eaten', 'shared_out', 'wasted'] as const) {
      await handlers['inventory.recordOutcome']({
        commandId: ids.next(),
        householdId,
        itemId,
        outcome,
        quantity: 1,
        ...(outcome === 'wasted' ? {} : { rescued: true }),
      });
    }
    // Still fresh: eating it is consumption and counts nowhere here.
    const fresh = await add({ name: 'Gruyère', priceRappen: 600, expiresOn: '2026-12-20' });
    await handlers['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId: fresh.itemId,
      outcome: 'eaten',
    });
    expect((await db.outcomes.where('itemId').equals(fresh.itemId).first())?.atRisk).toBe(false);
    const stats = await handlers['stats.waste']({
      householdId,
      from: localDate('2026-11-01'),
      to: localDate('2026-11-30'),
    });
    expect(stats).toEqual({
      savedRappen: 200,
      wastedRappen: 100,
      // Joghurt: 180 g per cup from the category.
      savedGrams: 360,
      wastedGrams: 180,
      savedCount: 2,
      wastedCount: 1,
      estimated: false,
    });
    const before = await handlers['stats.waste']({
      householdId,
      from: localDate('2026-10-01'),
      to: localDate('2026-10-31'),
    });
    expect(before.savedRappen).toBe(0);
  });
});
