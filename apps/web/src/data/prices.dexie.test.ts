import 'fake-indexeddb/auto';
import { IsoDateTimeSchema, type Id, type OperationInput } from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import { createInventoryHandlers, type InventoryHandlers } from './handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

/**
 * `prices.memory` on IndexedDB (Dexie). The logic lives in
 * packages/core/src/application/insights.ts.
 */

let inventory: InventoryHandlers;
let householdId: Id;
let ids: ReturnType<typeof sequentialIds>;

beforeEach(async () => {
  const db = testDb();
  ids = sequentialIds();
  const clock = fixedClock('2026-11-07T09:00:00.000Z', '2026-11-07');
  const profile = await ensureLocalHousehold(db, clock, ids, { household: 'WG', member: 'Lena' });
  householdId = profile.household.id;
  inventory = createInventoryHandlers({ db, clock, ids, actor: profile.member.id });
});

// Invented receipts: the same yoghurt at Coop twice and at Lidl once, one Coop «Aktion».
const receipt = (
  hash: string,
  retailer: OperationInput<'receipts.import'>['retailer'],
  at: string,
  price: number,
  discount = 0,
): OperationInput<'receipts.import'> => ({
  commandId: ids.next(),
  householdId,
  retailer,
  purchasedAt: IsoDateTimeSchema.parse(at),
  totalRappen: price + discount,
  source: 'pdf',
  hash: hash.repeat(64),
  lines: [
    {
      name: 'Skyr Natur',
      kind: 'item',
      quantity: 1,
      unit: 'pcs',
      priceRappen: price,
      discountRappen: discount,
      isFood: true,
    },
    {
      name: 'Tasche',
      kind: 'bag',
      quantity: 1,
      unit: 'pcs',
      priceRappen: 40,
      discountRappen: 0,
      isFood: false,
    },
  ],
});

describe('prices.memory (ADR-0029)', () => {
  it('remembers last, usual and cheapest price per product from the receipts', async () => {
    await inventory['receipts.import'](receipt('a', 'coop', '2026-10-20T16:00:00.000Z', 232));
    await inventory['receipts.import'](receipt('b', 'lidl', '2026-10-29T17:55:00.000Z', 232, -10));
    await inventory['receipts.import'](receipt('c', 'coop', '2026-11-05T17:47:00.000Z', 245));
    const { products } = await inventory['prices.memory']({
      householdId,
      names: ['skyr natur', 'Gipfeli', 'Tasche'],
    });
    expect(products[0]).toMatchObject({
      name: 'skyr natur',
      count: 3,
      last: { retailer: 'coop', purchasedOn: '2026-11-05', unitPriceRappen: 245, promotion: false },
      usualUnitPriceRappen: 232,
      cheapest: { retailer: 'lidl', unitPriceRappen: 222, promotion: true },
    });
    expect(products[1]).toEqual({ name: 'Gipfeli', count: 0 });
    // Bags and deposit are not products.
    expect(products[2]).toEqual({ name: 'Tasche', count: 0 });
  });
});
