import 'fake-indexeddb/auto';
import { type Id, type OperationInput } from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import type { FridgeDb } from './db';
import { createInventoryHandlers, type InventoryHandlers } from './handlers';
import { createHouseholdHandlers, type HouseholdHandlers } from './household-handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

let db: FridgeDb;
let inventory: InventoryHandlers;
let household: HouseholdHandlers;
let householdId: Id;
let ids: ReturnType<typeof sequentialIds>;
const clock = fixedClock('2026-11-12T09:00:00.000Z', '2026-11-12');
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';

beforeEach(async () => {
  db = testDb();
  ids = sequentialIds();
  const profile = await ensureLocalHousehold(db, clock, ids, { household: 'WG', member: 'Lena' });
  householdId = profile.household.id;
  const ctx = { db, clock, ids, actor: profile.member.id };
  inventory = createInventoryHandlers(ctx);
  household = createHouseholdHandlers(ctx);
});

async function sugarInSpot() {
  const { itemId } = await inventory['inventory.addItem']({
    commandId: ids.next(),
    householdId,
    name: 'Kristallzucker',
    location: 'pantry',
  });
  const productId = (await db.items.get(itemId))?.productId ?? ids.next();
  const { spotId } = await inventory['spots.create']({
    commandId: ids.next(),
    householdId,
    name: 'Oberer Schrank links',
    location: 'pantry',
    photo: PHOTO,
  });
  await inventory['products.setSpot']({ commandId: ids.next(), householdId, productId, spotId });
  return { itemId, productId, spotId };
}

describe('storage spots on Dexie (ADR-0056)', () => {
  it('saves a spot with photo, shows it on the item and counts it in the list', async () => {
    const { itemId, spotId } = await sugarInSpot();
    expect(await db.spots.count()).toBe(1);
    const { items } = await inventory['inventory.list']({ householdId });
    expect(items.find((item) => item.id === itemId)?.spot).toEqual({
      id: spotId,
      name: 'Oberer Schrank links',
      hasPhoto: true,
    });
    const { spots } = await inventory['spots.list']({ householdId });
    expect(spots).toEqual([
      expect.objectContaining({
        id: spotId,
        photo: PHOTO,
        itemCount: 1,
        itemNames: ['Kristallzucker'],
      }),
    ]);
  });

  it('round-trips through export, delete and import, photo included', async () => {
    const { spotId, productId } = await sugarInSpot();
    const file = JSON.parse(
      JSON.stringify(await household['household.export']({ householdId })),
    ) as OperationInput<'household.import'>['data'];
    expect(file.spots).toHaveLength(1);

    await household['household.delete']({ commandId: ids.next(), householdId, confirm: true });
    expect(await db.spots.count()).toBe(0);

    const fresh = await ensureLocalHousehold(db, clock, ids, { household: 'Neu', member: 'Ich' });
    await createHouseholdHandlers({ db, clock, ids, actor: fresh.member.id })['household.import']({
      commandId: ids.next(),
      householdId: fresh.household.id,
      data: file,
      confirm: true,
    });
    expect((await db.spots.get(spotId))?.photo).toBe(PHOTO);
    expect((await db.products.get(productId))?.spotId).toBe(spotId);
  });
});
