import 'fake-indexeddb/auto';
import { type Id, type OperationInput } from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import type { FridgeDb } from './db';
import { createInventoryHandlers } from './handlers';
import { createHouseholdHandlers } from './household-handlers';
import { createShoppingHandlers } from './shopping-handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

let db: FridgeDb;
let householdId: Id;
let ids: ReturnType<typeof sequentialIds>;
let ctx: Parameters<typeof createHouseholdHandlers>[0];

beforeEach(async () => {
  db = testDb();
  ids = sequentialIds();
  const clock = fixedClock('2026-11-06T09:00:00.000Z', '2026-11-06');
  const profile = await ensureLocalHousehold(db, clock, ids, { household: 'WG', member: 'Lena' });
  householdId = profile.household.id;
  ctx = { db, clock, ids, actor: profile.member.id };
});

describe('household export and delete', () => {
  it('exports everything of the household, deleted rows included', async () => {
    const inventory = createInventoryHandlers(ctx);
    const { itemId } = await inventory['inventory.addItem']({
      commandId: ids.next(),
      householdId,
      name: 'Joghurt',
      location: 'fridge',
      quantity: 2,
    });
    await inventory['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'eaten',
      quantity: 1,
    });
    await createShoppingHandlers(ctx)['shopping.addItem']({
      commandId: ids.next(),
      householdId,
      name: 'Milch',
    });

    const data = await createHouseholdHandlers(ctx)['household.export']({ householdId });
    expect(data).toMatchObject({
      format: 'fridgeai-export',
      contractVersion: 'v1',
      exportedAt: '2026-11-06T09:00:00.000Z',
      household: { id: householdId, name: 'WG' },
    });
    expect(data.members.map((member) => member.displayName)).toEqual(['Lena']);
    expect(data.items).toHaveLength(1);
    expect(data.outcomes).toHaveLength(1);
    expect(data.shoppingItems.map((entry) => entry.name)).toEqual(['Milch']);
    expect(data.events.map((event) => event.type)).toEqual(
      expect.arrayContaining(['item.added', 'item.consumed', 'shopping_list.item_added']),
    );
    // Plain JSON: the export survives a round trip through a file.
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });

  it('deletes everything only with confirm: true, caches included', async () => {
    const household = createHouseholdHandlers(ctx);
    await db.catalogCache.put({
      gtin: '7610000000004' as never,
      info: { gtin: '7610000000004' as never, name: 'Milch', source: 'off' },
      fetchedAt: '2026-11-06T09:00:00.000Z',
    });
    await expect(
      household['household.delete']({
        commandId: ids.next(),
        householdId,
        confirm: false as never,
      }),
    ).rejects.toThrow();
    expect(await db.households.count()).toBe(1);

    expect(
      await household['household.delete']({ commandId: ids.next(), householdId, confirm: true }),
    ).toEqual({ deleted: true });
    for (const table of db.tables) {
      expect(await table.count(), table.name).toBe(0);
    }
    await expect(household['household.export']({ householdId })).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});

describe('household import (ADR-0020)', () => {
  type ExportFile = OperationInput<'household.import'>['data'];

  /** Device A has a yoghurt, half eaten, and hands it out as a file. */
  async function exportFile(): Promise<ExportFile> {
    const inventory = createInventoryHandlers(ctx);
    const { itemId } = await inventory['inventory.addItem']({
      commandId: ids.next(),
      householdId,
      name: 'Joghurt',
      location: 'fridge',
      quantity: 2,
    });
    await inventory['inventory.recordOutcome']({
      commandId: ids.next(),
      householdId,
      itemId,
      outcome: 'eaten',
      quantity: 1,
    });
    const data = await createHouseholdHandlers(ctx)['household.export']({ householdId });
    return JSON.parse(JSON.stringify(data)) as ExportFile;
  }

  it('brings an export back on a new device and replaces what was there', async () => {
    const file = await exportFile();
    // Device B, e.g. the new web address: its own fresh household with one item.
    const deviceB = testDb();
    const clock = fixedClock('2026-11-08T10:00:00.000Z', '2026-11-08');
    const fresh = await ensureLocalHousehold(deviceB, clock, ids, {
      household: 'Neu',
      member: 'Ich',
    });
    const ctxB = { db: deviceB, clock, ids, actor: fresh.member.id };
    await createInventoryHandlers(ctxB)['inventory.addItem']({
      commandId: ids.next(),
      householdId: fresh.household.id,
      name: 'Butter',
      location: 'fridge',
    });

    const commandId = ids.next();
    const input = {
      commandId,
      householdId: fresh.household.id,
      data: file,
      confirm: true,
    } as const;
    const result = await createHouseholdHandlers(ctxB)['household.import'](input);
    expect(result).toMatchObject({ householdId, itemCount: 1, outcomeCount: 1 });

    // The app starts as the imported member; the fresh household is gone.
    const profile = await ensureLocalHousehold(deviceB, clock, ids, {
      household: 'X',
      member: 'Y',
    });
    expect(profile.household).toMatchObject({ id: householdId, name: 'WG' });
    expect(profile.member.displayName).toBe('Lena');
    expect(await deviceB.households.count()).toBe(1);
    const { items } = await createInventoryHandlers(ctxB)['inventory.list']({ householdId });
    expect(items.map((item) => [item.name, item.quantity])).toEqual([['Joghurt', 1]]);
    const back = await createHouseholdHandlers(ctxB)['household.export']({ householdId });
    expect(back.events.at(-1)).toMatchObject({
      type: 'household.imported',
      actor: result.memberId,
      payload: { exportedAt: '2026-11-06T09:00:00.000Z', itemCount: 1, outcomeCount: 1 },
    });

    // The same command again changes nothing.
    expect(await createHouseholdHandlers(ctxB)['household.import'](input)).toEqual(result);
    expect(await deviceB.events.where('type').equals('household.imported').count()).toBe(1);
  });

  it('refuses files with rows of another household and imports only with confirm: true', async () => {
    const file = await exportFile();
    const household = createHouseholdHandlers(ctx);
    const base = { commandId: ids.next(), householdId };
    await expect(
      household['household.import']({ ...base, data: file, confirm: false } as never),
    ).rejects.toThrow();
    await expect(
      household['household.import']({ ...base, data: { format: 'other' }, confirm: true } as never),
    ).rejects.toThrow();
    const foreign = {
      ...file,
      items: file.items.map((item) => ({ ...item, householdId: ids.next() })),
    };
    await expect(
      household['household.import']({ ...base, data: foreign, confirm: true }),
    ).rejects.toThrow(/another household/);
    // Nothing changed.
    expect(await db.items.count()).toBe(1);
  });
});
