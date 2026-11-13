import 'fake-indexeddb/auto';
import { IsoDateTimeSchema, toLocalDate, type Id, type OperationInput } from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import type { FridgeDb } from './db';
import { createHouseholdHandlers } from './household-handlers';
import { createInventoryHandlers, type InventoryHandlers } from './handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

let db: FridgeDb;
let inventory: InventoryHandlers;
let householdId: Id;
let ids: ReturnType<typeof sequentialIds>;
let ctx: Parameters<typeof createInventoryHandlers>[0];

beforeEach(async () => {
  db = testDb();
  ids = sequentialIds();
  const clock = fixedClock('2026-11-07T09:00:00.000Z', '2026-11-07');
  const profile = await ensureLocalHousehold(db, clock, ids, { household: 'WG', member: 'Lena' });
  householdId = profile.household.id;
  ctx = { db, clock, ids, actor: profile.member.id };
  inventory = createInventoryHandlers(ctx);
});

// A reviewed Coop receipt (invented): chicken on «Aktion», a yoghurt, a bag and a shampoo.
const receipt = (hash = 'a'.repeat(64)): OperationInput<'receipts.import'> => ({
  commandId: ids.next(),
  householdId,
  retailer: 'coop',
  storeName: 'Musterstadt Zentrum',
  purchasedAt: IsoDateTimeSchema.parse('2026-11-05T17:47:00.000Z'),
  totalRappen: 1525,
  source: 'pdf',
  hash,
  lines: [
    {
      name: 'Coop Pouletbrust',
      kind: 'item',
      quantity: 307,
      unit: 'g',
      unitPriceRappen: 3388,
      priceRappen: 1040,
      discountRappen: -210,
      isFood: true,
      location: 'fridge',
    },
    {
      name: 'Joghurt Mocca',
      kind: 'item',
      quantity: 2,
      unit: 'pcs',
      unitPriceRappen: 95,
      priceRappen: 190,
      discountRappen: 0,
      isFood: true,
      location: 'fridge',
    },
    {
      name: 'Shampoo',
      kind: 'item',
      quantity: 1,
      unit: 'pcs',
      priceRappen: 295,
      discountRappen: 0,
      isFood: false,
    },
    {
      name: 'Papiertasche',
      kind: 'bag',
      quantity: 1,
      unit: 'pcs',
      priceRappen: 40,
      discountRappen: 0,
      isFood: false,
    },
  ],
});

describe('receipts.import (ADR-0028)', () => {
  it('stores the receipt and its lines and adds the chosen items with the price paid', async () => {
    const result = await inventory['receipts.import'](receipt());
    expect(result.duplicate).toBe(false);
    expect(result.itemIds).toHaveLength(2);

    const { items } = await inventory['inventory.list']({ householdId });
    const chicken = items.find((item) => item.name === 'Coop Pouletbrust');
    expect(chicken).toMatchObject({
      quantity: 307,
      unit: 'g',
      location: 'fridge',
      priceRappen: 830,
    });
    expect(items.find((item) => item.name === 'Joghurt Mocca')?.priceRappen).toBe(190);
    expect(items.some((item) => item.name === 'Shampoo')).toBe(false);

    const lines = await db.receiptLines
      .where('receiptId')
      .equals(result.receiptId)
      .sortBy('position');
    expect(lines.map((line) => [line.name, line.kind, line.includedInInventory])).toEqual([
      ['Coop Pouletbrust', 'item', true],
      ['Joghurt Mocca', 'item', true],
      ['Shampoo', 'item', false],
      ['Papiertasche', 'bag', false],
    ]);
    expect(lines[0]).toMatchObject({ weightGrams: 307, discountRappen: -210 });
    const [firstItemId] = result.itemIds;
    const stored = firstItemId === undefined ? undefined : await db.items.get(firstItemId);
    expect(stored?.receiptLineId).toBe(lines[0]?.id);
    const events = await db.events.where('type').equals('receipt.imported').toArray();
    expect(events.map((event) => event.payload)).toEqual([
      { receiptId: result.receiptId, retailer: 'coop', lineCount: 4, totalRappen: 1525 },
    ]);
  });

  it('puts a date chosen in «Einzeln durchgehen» on the item, and estimates it otherwise', async () => {
    const base = receipt();
    const result = await inventory['receipts.import']({
      ...base,
      lines: base.lines.map((line) =>
        line.name === 'Joghurt Mocca' ? { ...line, expiresOn: toLocalDate('2026-12-24') } : line,
      ),
    });
    expect(result.itemIds).toHaveLength(2);
    const { items } = await inventory['inventory.list']({ householdId });
    expect(items.find((item) => item.name === 'Joghurt Mocca')?.expiresOn).toBe('2026-12-24');
    const chicken = items.find((item) => item.name === 'Coop Pouletbrust');
    expect(chicken?.expiresOn).toBeDefined();
    expect(chicken?.expiresOn).not.toBe('2026-12-24');
  });

  it('never imports the same receipt twice and repeats a command harmlessly', async () => {
    const first = receipt();
    const once = await inventory['receipts.import'](first);
    expect(await inventory['receipts.import'](first)).toEqual(once);
    const again = await inventory['receipts.import'](receipt());
    expect(again).toEqual({ receiptId: once.receiptId, itemIds: [], duplicate: true });
    expect(await db.receipts.count()).toBe(1);
    expect((await inventory['inventory.list']({ householdId })).items).toHaveLength(2);
  });

  it('names known receipts before the review, by hash only', async () => {
    await inventory['receipts.import'](receipt());
    const known = await inventory['receipts.known']({
      householdId,
      hashes: ['a'.repeat(64), 'b'.repeat(64)],
    });
    expect(known).toEqual({ known: ['a'.repeat(64)] });
    await expect(
      inventory['receipts.known']({ householdId, hashes: ['not-a-hash'] }),
    ).rejects.toThrow();
  });

  it('hands receipts out with the export', async () => {
    await inventory['receipts.import'](receipt());
    const exported = await createHouseholdHandlers(ctx)['household.export']({ householdId });
    expect(exported.receipts).toHaveLength(1);
    expect(exported.receiptLines.map((line) => line.name)).toContain('Papiertasche');
  });
});
