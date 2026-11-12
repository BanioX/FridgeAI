import { beforeEach, describe, expect, it } from 'vitest';
import {
  CONTRACT_V1,
  createInventoryUseCases,
  createMemoryStorage,
  IsoDateTimeSchema,
  localDate,
  uuidV7,
  type AchievementId,
  type Id,
  type Storage,
} from '../src';
import { first } from './achievements-fixtures';

/**
 * `stats.achievements` and `inventory.completeCheck` on memory storage (ADR-0054): the use case
 * reads the household's data through the ports; undo and delete take progress away again.
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

const add = (fields: Record<string, unknown> = {}) =>
  inventory['inventory.addItem']({
    commandId: next(),
    householdId,
    name: 'Joghurt',
    location: 'fridge',
    expiresOn: '2026-11-05',
    ...fields,
  });

const state = async (achievement: AchievementId) => {
  const { achievements } = await inventory['stats.achievements']({ householdId });
  const found = achievements.find((entry) => entry.id === achievement);
  if (found === undefined) {
    throw new Error(`No ${achievement}`);
  }
  return found;
};

describe('stats.achievements', () => {
  it('is a read-only query with the stats scope, whose output follows the schema', async () => {
    expect(CONTRACT_V1['stats.achievements']).toMatchObject({
      kind: 'query',
      scopes: ['stats:read'],
    });
    const output = await inventory['stats.achievements']({ householdId });
    expect(() => CONTRACT_V1['stats.achievements'].output.parse(output)).not.toThrow();
    expect(output.achievements).toHaveLength(18);
    expect(await storage.events.ofHousehold(householdId)).toHaveLength(0);
  });

  it('unlocks «Erste Rettung» with a confirmed rescue and takes it back on undo', async () => {
    const { itemId } = await add();
    expect((await state('first-rescue')).tier).toBe(0);
    const done = await inventory['inventory.recordOutcome']({
      commandId: next(),
      householdId,
      itemId,
      outcome: 'eaten',
      rescued: true,
    });
    expect(await state('first-rescue')).toMatchObject({ tier: 1, reachedOn: '2026-11-07' });
    expect((await state('savings')).progress.current).toBeGreaterThan(0);
    await inventory['inventory.undoOutcome']({
      commandId: next(),
      householdId,
      eventId: done.eventId,
    });
    expect(await state('first-rescue')).toMatchObject({ tier: 0, reachedOn: null });
    expect((await state('savings')).progress.current).toBe(0);
  });

  it('counts «Vorausschauend» from the move, with the date before it, and forgets deleted items', async () => {
    const fresh = await add({ name: 'Brot', expiresOn: '2026-11-09' });
    const late = await add({ name: 'Hackfleisch', expiresOn: '2026-11-05' });
    for (const target of [fresh, late]) {
      await inventory['inventory.move']({
        commandId: next(),
        householdId,
        itemId: target.itemId,
        to: 'freezer',
        allowUnsuitable: true,
      });
    }
    const moved = (await storage.events.ofHousehold(householdId)).filter(
      (event) => event.type === 'item.moved',
    );
    expect(moved.map((event) => event.payload.previousExpiresOn)).toEqual([
      '2026-11-09',
      '2026-11-05',
    ]);
    expect((await state('foresight')).progress.current).toBe(1);
    await inventory['inventory.deleteItem']({
      commandId: next(),
      householdId,
      itemId: fresh.itemId,
    });
    expect((await state('foresight')).progress.current).toBe(0);
  });

  it('counts «Gekocht» and «Backstube» from inventory.process, and not after deleting the result', async () => {
    const flour = await add({ name: 'Mehl', expiresOn: '2027-01-01', location: 'pantry' });
    const done = await inventory['inventory.process']({
      commandId: next(),
      householdId,
      ingredients: [{ itemId: flour.itemId }],
      result: { name: 'Zopf selbst gemacht', kind: 'made' },
      recipeId: 'zopf',
    });
    expect((await state('at-the-stove')).progress.current).toBe(1);
    expect((await state('bakery')).progress.current).toBe(1);
    // «Rückgängig» in the app: the ingredient outcome is undone and the result deleted.
    for (const eventId of done.outcomeIds) {
      await inventory['inventory.undoOutcome']({ commandId: next(), householdId, eventId });
    }
    const resultId = done.resultItemId;
    if (resultId === undefined) {
      throw new Error('Expected a result');
    }
    await inventory['inventory.deleteItem']({ commandId: next(), householdId, itemId: resultId });
    expect((await state('at-the-stove')).progress.current).toBe(0);
    expect((await state('bakery')).progress.current).toBe(0);
  });

  it('takes the Notvorrat water from the members of the household', async () => {
    // One piece of «Trinkwasser-Vorrat» is a typical pack of 9 litres (a six-pack).
    await add({ name: 'Notwasser', location: 'reserve', categoryId: 'reserve-water' });
    expect((await state('survival')).progress.current).toBe(1);
    const members = [id(40), id(41)].map((memberId) => ({
      id: memberId,
      householdId,
      updatedAt: now,
      displayName: 'Max Muster',
      role: 'member' as const,
      joinedAt: now,
    }));
    for (const member of members) {
      await storage.members.put(member);
    }
    // Two members need 18 litres.
    expect((await state('survival')).progress.current).toBe(0);
    await storage.members.put({ ...first(members), leftAt: now });
    expect((await state('survival')).progress.current).toBe(1);
  });
});

describe('inventory.completeCheck', () => {
  const complete = (commandId = next(), itemCount = 4) =>
    inventory['inventory.completeCheck']({ commandId, householdId, itemCount });

  it('records the event check.completed with the item count and returns today', async () => {
    expect(CONTRACT_V1['inventory.completeCheck']).toMatchObject({
      kind: 'command',
      scopes: ['inventory:write'],
    });
    expect(await complete()).toEqual({ completedOn: '2026-11-07' });
    const events = await storage.events.ofHousehold(householdId);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'check.completed',
      actor,
      payload: { itemCount: 4 },
    });
  });

  it('is idempotent: the same commandId records one event', async () => {
    const commandId = next();
    await complete(commandId);
    await complete(commandId);
    expect(await storage.events.ofHousehold(householdId)).toHaveLength(1);
  });

  it('rejects an empty check', async () => {
    await expect(complete(next(), 0)).rejects.toThrow();
  });

  it('feeds «Treu»: the week of the check is running', async () => {
    await complete();
    expect((await state('loyal')).progress).toEqual({ current: 1, next: 4 });
  });
});
