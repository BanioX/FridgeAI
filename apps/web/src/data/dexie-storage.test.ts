import 'fake-indexeddb/auto';
import {
  IsoDateTimeSchema,
  OutcomeEventSchema,
  rappen,
  type Id,
  type Storage,
} from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { dexieStorage } from './dexie-storage';
import { sequentialIds, testDb } from './test-helpers';

/** The Dexie adapter behaves like the reference memory storage (packages/core). */
let storage: Storage;
let ids: ReturnType<typeof sequentialIds>;
let householdId: Id;
const now = IsoDateTimeSchema.parse('2026-11-07T09:00:00.000Z');

beforeEach(() => {
  storage = dexieStorage(testDb());
  ids = sequentialIds();
  householdId = ids.next();
});

const entry = (name: string, household = householdId) => ({
  id: ids.next(),
  householdId: household,
  updatedAt: now,
  name,
  checked: false,
  addedBy: householdId,
});

describe('dexieStorage', () => {
  it('reads one household only', async () => {
    await storage.shoppingItems.add(entry('Milch'));
    await storage.shoppingItems.add(entry('Brot', ids.next()));
    const rows = await storage.shoppingItems.ofHousehold(householdId);
    expect(rows.map((row) => row.name)).toEqual(['Milch']);
  });

  it('rolls back every write of a failing transaction', async () => {
    const row = entry('Joghurt');
    await storage.shoppingItems.add(row);
    await expect(
      storage.transaction(async () => {
        await storage.shoppingItems.put({ ...row, name: 'Quark' });
        await storage.commands.record({
          commandId: ids.next(),
          operation: 'shopping.addItem',
          result: {},
          at: now,
        });
        throw new Error('stop');
      }),
    ).rejects.toThrow('stop');
    expect((await storage.shoppingItems.get(row.id))?.name).toBe('Joghurt');
  });

  it('finds outcomes by item', async () => {
    const itemId = ids.next();
    const outcome = OutcomeEventSchema.parse({
      id: ids.next(),
      householdId,
      updatedAt: now,
      itemId,
      outcome: 'eaten',
      quantity: 1,
      valueRappen: rappen(250),
      valueEstimated: false,
      owner: 'shared',
      at: now,
      by: householdId,
    });
    await storage.outcomes.add(outcome);
    expect(await storage.outcomes.ofItem(itemId)).toHaveLength(1);
    expect(await storage.outcomes.ofItem(ids.next())).toEqual([]);
  });
});
