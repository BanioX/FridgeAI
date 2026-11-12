import { beforeEach, describe, expect, it } from 'vitest';
import {
  CommandError,
  createHouseholdUseCases,
  createInventoryUseCases,
  createMemoryStorage,
  HouseholdSchema,
  IsoDateTimeSchema,
  localDate,
  MemberSchema,
  uuidV7,
  type Id,
  type Storage,
} from '../src';

/** The people of a household on memory storage (ADR-0058). */
let storage: Storage;
let household: ReturnType<typeof createHouseholdUseCases>;
let inventory: ReturnType<typeof createInventoryUseCases>;
let next: () => Id;
const householdId = id(1);
const actor = id(2);
const now = IsoDateTimeSchema.parse('2026-11-12T09:00:00.000Z');

function id(counter: number): Id {
  const random = new Uint8Array(10);
  random[9] = counter;
  return uuidV7(1_762_500_000_000 + counter, random);
}

beforeEach(async () => {
  let counter = 10;
  next = () => id((counter += 1));
  storage = createMemoryStorage();
  const ctx = {
    storage,
    clock: { now: () => now, today: () => localDate('2026-11-12') },
    ids: { next },
    actor,
  };
  household = createHouseholdUseCases(ctx);
  inventory = createInventoryUseCases(ctx);
  await storage.households.add(
    HouseholdSchema.parse({
      id: householdId,
      name: 'WG',
      plan: 'free',
      createdAt: now,
      updatedAt: now,
    }),
  );
  await storage.members.add(
    MemberSchema.parse({
      id: actor,
      householdId,
      displayName: 'Noah',
      role: 'owner',
      joinedAt: now,
      updatedAt: now,
    }),
  );
});

const addMember = (displayName: string, commandId = next()) =>
  household['household.addMember']({ commandId, householdId, displayName });
const members = () => household['household.members']({ householdId });
const removeMember = (memberId: Id) =>
  household['household.removeMember']({ commandId: next(), householdId, memberId });

async function addItem(name: string, owner?: Id) {
  const result = await inventory['inventory.addItem']({
    commandId: next(),
    householdId,
    name,
    location: 'fridge',
    ...(owner === undefined ? {} : { owner }),
  });
  return result.itemId;
}

describe('household members', () => {
  it('lists the acting person and marks them', async () => {
    const { members: list } = await members();
    expect(list).toEqual([
      { id: actor, displayName: 'Noah', initials: 'N', role: 'owner', isSelf: true },
    ]);
  });

  it('adds a person once per command and records an event', async () => {
    const commandId = next();
    const first = await addMember(' Mia ', commandId);
    const again = await addMember(' Mia ', commandId);
    expect(again).toEqual(first);
    const { members: list } = await members();
    expect(list.map((member) => member.displayName)).toEqual(['Noah', 'Mia']);
    expect(list[1]).toMatchObject({ role: 'member', isSelf: false });
    expect((await storage.events.ofHousehold(householdId)).map((event) => event.type)).toEqual([
      'member.added',
    ]);
  });

  it('refuses a second person with the same name', async () => {
    await addMember('Mia');
    await expect(addMember('mia')).rejects.toMatchObject({ code: 'duplicate_name' });
  });

  it('tells apart initials that collide', async () => {
    await addMember('Max');
    await addMember('Mia');
    const { members: list } = await members();
    expect(list.map((member) => member.initials)).toEqual(['N', 'Ma', 'Mi']);
  });

  it('renames a person', async () => {
    const { memberId } = await addMember('Mia');
    await household['household.renameMember']({
      commandId: next(),
      householdId,
      memberId,
      displayName: 'Mia Muster',
    });
    const { members: list } = await members();
    expect(list.map((member) => member.displayName)).toContain('Mia Muster');
    expect((await storage.events.ofHousehold(householdId)).map((event) => event.type)).toEqual([
      'member.added',
      'member.renamed',
    ]);
  });

  it('removes a person: leftAt is set and their items belong to everyone', async () => {
    const { memberId } = await addMember('Mia');
    const mousse = await addItem('Schokoladenmousse', memberId);
    const milk = await addItem('Vollmilch');
    expect(await removeMember(memberId)).toEqual({ memberId, itemsShared: 1 });
    expect((await storage.members.get(memberId))?.leftAt).toBe(now);
    expect((await storage.items.get(mousse))?.owner).toBe('shared');
    expect((await storage.items.get(milk))?.owner).toBe('shared');
    expect((await members()).members).toHaveLength(1);
    expect((await storage.events.ofHousehold(householdId)).at(-1)).toMatchObject({
      type: 'member.removed',
      payload: { memberId, itemsShared: 1 },
    });
  });

  it('cannot remove the owner, the acting person or the last person', async () => {
    const { memberId } = await addMember('Mia');
    await expect(removeMember(actor)).rejects.toMatchObject({ code: 'cannot_remove' });
    await removeMember(memberId);
    await expect(removeMember(actor)).rejects.toBeInstanceOf(CommandError);
    expect((await members()).members).toHaveLength(1);
  });

  it('cannot rename a person who is gone', async () => {
    const { memberId } = await addMember('Mia');
    await removeMember(memberId);
    await expect(
      household['household.renameMember']({
        commandId: next(),
        householdId,
        memberId,
        displayName: 'Miri',
      }),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('inventory.updateItem owner', () => {
  const update = (itemId: Id, owner: Id | 'shared') =>
    inventory['inventory.updateItem']({ commandId: next(), householdId, itemId, owner });

  it('sets and clears the owner of an item', async () => {
    const { memberId } = await addMember('Mia');
    const itemId = await addItem('Schokoladenmousse');
    expect((await update(itemId, memberId)).changed).toEqual(['owner']);
    expect((await storage.items.get(itemId))?.owner).toBe(memberId);
    expect((await update(itemId, 'shared')).changed).toEqual(['owner']);
    expect((await storage.items.get(itemId))?.owner).toBe('shared');
  });

  it('does nothing when the owner stays the same', async () => {
    const itemId = await addItem('Vollmilch');
    expect((await update(itemId, 'shared')).changed).toEqual([]);
  });

  it('refuses a stranger and a person who left', async () => {
    const itemId = await addItem('Vollmilch');
    await expect(update(itemId, id(99))).rejects.toMatchObject({ code: 'invalid_owner' });
    const { memberId } = await addMember('Mia');
    await removeMember(memberId);
    await expect(update(itemId, memberId)).rejects.toMatchObject({ code: 'invalid_owner' });
  });
});
