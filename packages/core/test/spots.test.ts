import { beforeEach, describe, expect, it } from 'vitest';
import {
  CONTRACT_V1,
  createHouseholdUseCases,
  createInventoryUseCases,
  createMemoryStorage,
  createSpotUseCases,
  HouseholdExportSchema,
  IsoDateTimeSchema,
  localDate,
  uuidV7,
  type Id,
  type Storage,
} from '../src';

/** «Wo ist was?» (ADR-0056): spots with photos, on memory storage. */
let storage: Storage;
let inventory: ReturnType<typeof createInventoryUseCases>;
let spots: ReturnType<typeof createSpotUseCases>;
let household: ReturnType<typeof createHouseholdUseCases>;
let counter = 10;
const id = (n: number): Id => uuidV7(1_762_500_000_000 + n, new Uint8Array(10).fill(n));
const next = () => id((counter += 1));
const householdId = id(1);
const now = IsoDateTimeSchema.parse('2026-11-12T09:00:00.000Z');
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';

beforeEach(() => {
  storage = createMemoryStorage();
  const ctx = {
    storage,
    clock: { now: () => now, today: () => localDate('2026-11-12') },
    ids: { next },
    actor: id(2),
  };
  inventory = createInventoryUseCases(ctx);
  spots = createSpotUseCases(ctx);
  household = createHouseholdUseCases(ctx);
});

const add = (name: string, location: 'fridge' | 'freezer' | 'pantry' | 'reserve' = 'pantry') =>
  inventory['inventory.addItem']({ commandId: next(), householdId, name, location });

const createSpot = (
  name: string,
  location: 'fridge' | 'freezer' | 'pantry' | 'reserve' = 'pantry',
  photo?: string,
) =>
  spots['spots.create']({
    commandId: next(),
    householdId,
    name,
    location,
    ...(photo === undefined ? {} : { photo }),
  });

const productOf = async (itemId: Id) => {
  const item = await storage.items.get(itemId);
  return storage.products.get(item?.productId ?? id(99));
};

describe('spots.create', () => {
  it('stores the spot with a trimmed name and writes an event', async () => {
    const { spotId } = await createSpot('  Oberer Schrank links  ', 'pantry', PHOTO);
    expect(await storage.spots.get(spotId)).toMatchObject({
      name: 'Oberer Schrank links',
      location: 'pantry',
      photo: PHOTO,
      createdAt: now,
    });
    const types = (await storage.events.ofHousehold(householdId)).map((event) => event.type);
    expect(types).toContain('spot.created');
  });

  it('refuses invalid photos, empty and too long names', async () => {
    for (const photo of [
      'hello',
      'data:image/png;base64,AAAA',
      'data:image/jpeg;base64,AAA AAA',
      `data:image/jpeg;base64,${'A'.repeat(450_000)}`,
    ]) {
      await expect(createSpot('Schublade', 'pantry', photo)).rejects.toThrow();
    }
    await expect(createSpot('   ')).rejects.toThrow();
    await expect(createSpot('x'.repeat(41))).rejects.toThrow();
    expect(await storage.spots.ofHousehold(householdId)).toHaveLength(0);
  });

  it('is idempotent by commandId', async () => {
    const commandId = next();
    const input = { commandId, householdId, name: 'Gemüsefach', location: 'fridge' } as const;
    const first = await spots['spots.create'](input);
    const second = await spots['spots.create'](input);
    expect(second).toEqual(first);
    expect(await storage.spots.ofHousehold(householdId)).toHaveLength(1);
  });
});

describe('spots.update', () => {
  it('renames, replaces and removes the photo', async () => {
    const { spotId } = await createSpot('Schrank', 'pantry', PHOTO);
    await spots['spots.update']({ commandId: next(), householdId, spotId, name: 'Schrank rechts' });
    expect(await storage.spots.get(spotId)).toMatchObject({ name: 'Schrank rechts', photo: PHOTO });
    const other = 'data:image/webp;base64,UklGRg==';
    await spots['spots.update']({ commandId: next(), householdId, spotId, photo: other });
    expect((await storage.spots.get(spotId))?.photo).toBe(other);
    await spots['spots.update']({ commandId: next(), householdId, spotId, photo: null });
    expect((await storage.spots.get(spotId))?.photo).toBeUndefined();
    expect((await storage.spots.get(spotId))?.name).toBe('Schrank rechts');
  });

  it('does nothing without a change and rejects an unknown spot', async () => {
    const { spotId } = await createSpot('Schrank');
    expect(await spots['spots.update']({ commandId: next(), householdId, spotId })).toEqual({
      updated: false,
    });
    await expect(
      spots['spots.update']({ commandId: next(), householdId, spotId: id(99), name: 'x' }),
    ).rejects.toMatchObject({ code: 'not_found' });
    await expect(
      spots['spots.update']({ commandId: next(), householdId, spotId, photo: 'nope' }),
    ).rejects.toThrow();
  });
});

describe('products.setSpot', () => {
  it('sets and clears the spot of a product', async () => {
    const { itemId } = await add('Kristallzucker');
    const product = await productOf(itemId);
    const { spotId } = await createSpot('Oberer Schrank links');
    await spots['products.setSpot']({
      commandId: next(),
      householdId,
      productId: product?.id ?? id(99),
      spotId,
    });
    expect((await productOf(itemId))?.spotId).toBe(spotId);
    await spots['products.setSpot']({
      commandId: next(),
      householdId,
      productId: product?.id ?? id(99),
      spotId: null,
    });
    expect((await productOf(itemId))?.spotId).toBeUndefined();
    const types = (await storage.events.ofHousehold(householdId)).map((event) => event.type);
    expect(types.filter((type) => type === 'product.spot_set')).toHaveLength(2);
  });

  it('needs an existing, not deleted spot and an existing product', async () => {
    const { itemId } = await add('Tee');
    const productId = (await productOf(itemId))?.id ?? id(99);
    await expect(
      spots['products.setSpot']({ commandId: next(), householdId, productId, spotId: id(98) }),
    ).rejects.toMatchObject({ code: 'not_found' });
    const { spotId } = await createSpot('Schublade');
    await spots['spots.delete']({ commandId: next(), householdId, spotId });
    await expect(
      spots['products.setSpot']({ commandId: next(), householdId, productId, spotId }),
    ).rejects.toMatchObject({ code: 'not_found' });
    await expect(
      spots['products.setSpot']({
        commandId: next(),
        householdId,
        productId: id(97),
        spotId: null,
      }),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('spots.delete', () => {
  it('soft deletes the spot and clears it from every product', async () => {
    const sugar = await add('Kristallzucker');
    const tea = await add('Tee');
    const { spotId } = await createSpot('Schrank');
    for (const { itemId } of [sugar, tea]) {
      await spots['products.setSpot']({
        commandId: next(),
        householdId,
        productId: (await productOf(itemId))?.id ?? id(99),
        spotId,
      });
    }
    expect(await spots['spots.delete']({ commandId: next(), householdId, spotId })).toEqual({
      deleted: true,
      productCount: 2,
    });
    expect((await storage.spots.get(spotId))?.deletedAt).toBe(now);
    expect((await productOf(sugar.itemId))?.spotId).toBeUndefined();
    expect((await productOf(tea.itemId))?.spotId).toBeUndefined();
    expect((await spots['spots.list']({ householdId })).spots).toEqual([]);
    await expect(
      spots['spots.delete']({ commandId: next(), householdId, spotId }),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('spots.list', () => {
  it('orders by location, then name, and counts items in the spot location only', async () => {
    const freezerSpot = await createSpot('Schublade unten', 'freezer');
    const pantryB = await createSpot('Schrank rechts', 'pantry', PHOTO);
    const pantryA = await createSpot('Oberer Schrank links', 'pantry');
    const fridge = await createSpot('Gemüsefach', 'fridge');
    const sugar = await add('Kristallzucker');
    const sugarProduct = (await productOf(sugar.itemId))?.id ?? id(99);
    await spots['products.setSpot']({
      commandId: next(),
      householdId,
      productId: sugarProduct,
      spotId: pantryA.spotId,
    });
    // A second pack of the same product, and one moved to the freezer (spot not in that location).
    await add('Kristallzucker');
    const moved = await add('Kristallzucker');
    await inventory['inventory.move']({
      commandId: next(),
      householdId,
      itemId: moved.itemId,
      to: 'freezer',
      allowUnsuitable: true,
    });

    const { spots: listed } = await spots['spots.list']({ householdId });
    expect(listed.map((spot) => spot.id)).toEqual([
      fridge.spotId,
      freezerSpot.spotId,
      pantryA.spotId,
      pantryB.spotId,
    ]);
    const first = listed.find((spot) => spot.id === pantryA.spotId);
    expect(first).toMatchObject({ itemCount: 2, itemNames: ['Kristallzucker', 'Kristallzucker'] });
    expect(listed.find((spot) => spot.id === pantryB.spotId)).toMatchObject({
      itemCount: 0,
      photo: PHOTO,
    });
    expect(listed.find((spot) => spot.id === fridge.spotId)?.photo).toBeUndefined();
  });

  it('lists at most ten names', async () => {
    const { spotId } = await createSpot('Schrank');
    for (let index = 0; index < 12; index += 1) {
      const { itemId } = await add(`Produkt ${String(index)}`);
      await spots['products.setSpot']({
        commandId: next(),
        householdId,
        productId: (await productOf(itemId))?.id ?? id(99),
        spotId,
      });
    }
    const [spot] = (await spots['spots.list']({ householdId })).spots;
    expect(spot?.itemCount).toBe(12);
    expect(spot?.itemNames).toHaveLength(10);
  });
});

describe('item view', () => {
  it('shows the spot only in the location the spot lies in', async () => {
    const { itemId } = await add('Kristallzucker');
    const { spotId } = await createSpot('Oberer Schrank links', 'pantry', PHOTO);
    await spots['products.setSpot']({
      commandId: next(),
      householdId,
      productId: (await productOf(itemId))?.id ?? id(99),
      spotId,
    });
    const view = async () =>
      (await inventory['inventory.list']({ householdId })).items.find((item) => item.id === itemId);
    expect((await view())?.spot).toEqual({
      id: spotId,
      name: 'Oberer Schrank links',
      hasPhoto: true,
    });
    await inventory['inventory.move']({
      commandId: next(),
      householdId,
      itemId,
      to: 'freezer',
      allowUnsuitable: true,
    });
    expect((await view())?.spot).toBeNull();
    await inventory['inventory.move']({ commandId: next(), householdId, itemId, to: 'pantry' });
    expect((await view())?.spot?.id).toBe(spotId);
  });

  it('is null for a product without a spot', async () => {
    await add('Tee');
    const [view] = (await inventory['inventory.list']({ householdId })).items;
    expect(view?.spot).toBeNull();
  });
});

describe('export and import of spots (ADR-0020)', () => {
  it('hands out spots with photos, deleted ones included, and old files still parse', async () => {
    await storage.households.add({
      id: householdId,
      updatedAt: now,
      name: 'WG',
      plan: 'free',
      createdAt: now,
    });
    await storage.members.put({
      id: id(2),
      householdId,
      updatedAt: now,
      displayName: 'A',
      role: 'owner',
      joinedAt: now,
    });
    const { itemId } = await add('Kristallzucker');
    const keep = await createSpot('Schrank', 'pantry', PHOTO);
    const gone = await createSpot('Alte Kiste');
    await spots['products.setSpot']({
      commandId: next(),
      householdId,
      productId: (await productOf(itemId))?.id ?? id(99),
      spotId: keep.spotId,
    });
    await spots['spots.delete']({ commandId: next(), householdId, spotId: gone.spotId });

    const exported = await household['household.export']({ householdId });
    expect(exported.spots.map((spot) => spot.id).sort()).toEqual([keep.spotId, gone.spotId].sort());
    expect(exported.spots.find((spot) => spot.id === keep.spotId)?.photo).toBe(PHOTO);
    expect(exported.products[0]?.spotId).toBe(keep.spotId);

    // The file survives JSON and the import schema, and an old file without spots stays valid.
    const roundTrip = JSON.parse(JSON.stringify(exported)) as Record<string, unknown>;
    expect(HouseholdExportSchema.parse(roundTrip).spots).toEqual(exported.spots);
    expect(
      CONTRACT_V1['household.import'].input.safeParse({
        commandId: id(50),
        householdId,
        confirm: true,
        data: roundTrip,
      }).success,
    ).toBe(true);
    delete roundTrip.spots;
    expect(HouseholdExportSchema.parse(roundTrip).spots).toEqual([]);
  });

  it('refuses an import with a spot of another household', () => {
    const base = {
      commandId: id(50),
      householdId,
      confirm: true,
    };
    const parsed = CONTRACT_V1['household.import'].input.safeParse({
      ...base,
      data: {
        format: 'fridgeai-export',
        contractVersion: 'v1',
        exportedAt: now,
        household: { id: householdId, updatedAt: now, name: 'WG', plan: 'free', createdAt: now },
        members: [
          {
            id: id(2),
            householdId,
            updatedAt: now,
            displayName: 'A',
            role: 'owner',
            joinedAt: now,
          },
        ],
        products: [],
        items: [],
        outcomes: [],
        shoppingItems: [],
        receipts: [],
        receiptLines: [],
        spots: [
          {
            id: id(60),
            householdId: id(77),
            updatedAt: now,
            createdAt: now,
            name: 'Fremd',
            location: 'pantry',
          },
        ],
        events: [],
      },
    });
    expect(parsed.success).toBe(false);
  });
});
