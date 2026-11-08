import 'fake-indexeddb/auto';
import { IsoDateTimeSchema, localDate, rappen, type Id } from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import { createInventoryHandlers, type InventoryHandlers } from './handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

/**
 * `reports.build` on IndexedDB (Dexie). The logic lives in
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

const add = async (name: string, expiresOn: string, priceRappen?: number) =>
  (
    await inventory['inventory.addItem']({
      commandId: ids.next(),
      householdId,
      name,
      location: 'fridge',
      expiresOn: localDate(expiresOn),
      ...(priceRappen === undefined ? {} : { priceRappen: rappen(priceRappen) }),
    })
  ).itemId;

describe('reports.build (ADR-0030)', () => {
  it('reports the fridge, what was saved and wasted and the receipts, on the device', async () => {
    await add('Skyr Natur', '2026-11-08', 185);
    await add('Vollmilch', '2026-11-20', 125);
    const bread = await add('Ruchbrot', '2026-11-06', 380);
    // Eaten on its last day and confirmed: a rescue (ADR-0033, ADR-0039).
    const cheese = await add('Gruyère', '2026-11-07', 600);
    await inventory['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId: bread,
      outcome: 'wasted',
      quantity: 1,
      wasteReason: 'forgotten',
    });
    await inventory['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId: cheese,
      outcome: 'eaten',
      quantity: 1,
      rescued: true,
    });
    await inventory['receipts.import']({
      commandId: ids.next(),
      householdId,
      retailer: 'coop',
      purchasedAt: IsoDateTimeSchema.parse('2026-11-05T17:47:00.000Z'),
      totalRappen: rappen(1290),
      source: 'pdf',
      hash: 'a'.repeat(64),
      lines: [
        {
          name: 'Tasche',
          kind: 'bag',
          quantity: 1,
          unit: 'pcs',
          priceRappen: rappen(40),
          discountRappen: rappen(0),
          isFood: false,
        },
      ],
    });

    const report = await inventory['reports.build']({
      householdId,
      from: localDate('2026-11-01'),
      to: localDate('2026-11-07'),
    });
    expect(report.fridge).toMatchObject({ itemCount: 2, valueRappen: 310, valueEstimated: false });
    expect(report.fridge.urgent.map((item) => [item.name, item.daysLeft])).toEqual([
      ['Skyr Natur', 1],
    ]);
    expect(report.impact).toMatchObject({ savedRappen: 600, wastedRappen: 380 });
    expect(report.impact.topWasted).toEqual([
      { categoryId: 'bakery-bread', count: 1, valueRappen: 380 },
    ]);
    expect(report.impact.reasons).toEqual([{ reason: 'forgotten', count: 1 }]);
    expect(report.shopping).toEqual({
      receiptCount: 1,
      spentRappen: 1290,
      byRetailer: [{ retailer: 'coop', receiptCount: 1, spentRappen: 1290 }],
    });
  });

  it('refuses a period that ends before it starts', async () => {
    await expect(
      inventory['reports.build']({
        householdId,
        from: localDate('2026-11-07'),
        to: localDate('2026-11-01'),
      }),
    ).rejects.toThrow();
  });
});
