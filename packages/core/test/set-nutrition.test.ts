import { beforeEach, describe, expect, it } from 'vitest';
import {
  createInventoryUseCases,
  createMemoryStorage,
  IsoDateTimeSchema,
  localDate,
  uuidV7,
  type Id,
  type Nutrition,
  type Storage,
} from '../src';

/** `products.setNutrition` on memory storage: nutrition read from a label photo. */
let storage: Storage;
let inventory: ReturnType<typeof createInventoryUseCases>;
let counter = 10;
const id = (n: number): Id => uuidV7(1_762_500_000_000 + n, new Uint8Array(10).fill(n));
const next = () => id((counter += 1));
const householdId = id(1);
const nutrition: Nutrition = {
  basis: '100g',
  energyKcal: 250,
  fat: 8.5,
  protein: 6.4,
  source: 'manual',
};

beforeEach(() => {
  storage = createMemoryStorage();
  inventory = createInventoryUseCases({
    storage,
    clock: {
      now: () => IsoDateTimeSchema.parse('2026-11-07T09:00:00.000Z'),
      today: () => localDate('2026-11-07'),
    },
    ids: { next },
    actor: id(2),
  });
});

const add = (name = 'Vollmilch') =>
  inventory['inventory.addItem']({ commandId: next(), householdId, name, location: 'fridge' });

describe('products.setNutrition', () => {
  it('sets the nutrition on the product, writes an event and shows it in the list', async () => {
    const { itemId } = await add();
    const { productId } = await inventory['products.setNutrition']({
      commandId: next(),
      householdId,
      itemId,
      nutrition,
    });
    expect((await storage.products.get(productId))?.nutrition).toEqual(nutrition);
    const events = await storage.events.ofHousehold(householdId);
    expect(events.at(-1)).toMatchObject({
      type: 'product.nutrition_set',
      payload: { productId, itemId },
    });
    const { items } = await inventory['inventory.list']({ householdId });
    expect(items[0]?.nutrition).toEqual(nutrition);
  });

  it('is idempotent by commandId', async () => {
    const { itemId } = await add();
    const commandId = next();
    const first = await inventory['products.setNutrition']({
      commandId,
      householdId,
      itemId,
      nutrition,
    });
    const second = await inventory['products.setNutrition']({
      commandId,
      householdId,
      itemId,
      nutrition: { ...nutrition, fat: 1 },
    });
    expect(second).toEqual(first);
    expect((await storage.products.get(first.productId))?.nutrition?.fat).toBe(8.5);
  });

  it('replaces earlier values', async () => {
    const { itemId } = await add();
    const set = (value: Nutrition) =>
      inventory['products.setNutrition']({
        commandId: next(),
        householdId,
        itemId,
        nutrition: value,
      });
    await set(nutrition);
    const { productId } = await set({ basis: '100ml', energyKcal: 43, source: 'manual' });
    expect((await storage.products.get(productId))?.nutrition).toEqual({
      basis: '100ml',
      energyKcal: 43,
      source: 'manual',
    });
  });

  it('answers not_found for unknown, foreign and deleted items', async () => {
    const { itemId } = await add();
    const set = (fields: { itemId: Id; householdId?: Id }) =>
      inventory['products.setNutrition']({ commandId: next(), householdId, nutrition, ...fields });
    await expect(set({ itemId: id(99) })).rejects.toMatchObject({ code: 'not_found' });
    await expect(set({ itemId, householdId: id(98) })).rejects.toMatchObject({ code: 'not_found' });
    await inventory['inventory.deleteItem']({ commandId: next(), householdId, itemId });
    await expect(set({ itemId })).rejects.toMatchObject({ code: 'not_found' });
  });

  it('rejects values outside the schema', async () => {
    const { itemId } = await add();
    await expect(
      inventory['products.setNutrition']({
        commandId: next(),
        householdId,
        itemId,
        nutrition: { ...nutrition, fat: 120 },
      }),
    ).rejects.toThrow();
  });
});
