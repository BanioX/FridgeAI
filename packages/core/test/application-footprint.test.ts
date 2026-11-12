import { beforeEach, describe, expect, it } from 'vitest';
import {
  CurrencyCodeSchema,
  createInventoryUseCases,
  createMemoryStorage,
  HouseholdSchema,
  IsoDateTimeSchema,
  localDate,
  uuidV7,
  type Id,
  type Storage,
} from '../src';

/** `stats.footprint` (ADR-0057) on memory storage: counted like the Bilanz. */
let storage: Storage;
let inventory: ReturnType<typeof createInventoryUseCases>;
let next: () => Id;
const householdId = id(1);
const actor = id(2);
const now = IsoDateTimeSchema.parse('2026-11-07T09:00:00.000Z');
const from = localDate('2026-11-01');
const to = localDate('2026-11-30');

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

const add = (name: string, fields: Record<string, unknown> = {}) =>
  inventory['inventory.addItem']({
    commandId: next(),
    householdId,
    name,
    location: 'fridge',
    ...fields,
  });

const close = (itemId: Id, outcome: 'eaten' | 'wasted', rescued = false) =>
  inventory['inventory.recordOutcome']({
    commandId: next(),
    householdId,
    itemId,
    outcome,
    ...(rescued ? { rescued: true } : {}),
  });

const footprint = () => inventory['stats.footprint']({ householdId, from, to });

describe('stats.footprint', () => {
  it('rescued and entsorgt food count, plain eating does not', async () => {
    const rescued = await add('Joghurt', { expiresOn: '2026-11-07' });
    await close(rescued.itemId, 'eaten', true);
    const wasted = await add('Vollmilch', { expiresOn: '2026-11-03', quantity: 500, unit: 'ml' });
    await close(wasted.itemId, 'wasted');
    const eaten = await add('Vollmilch', { quantity: 1000, unit: 'ml' });
    await close(eaten.itemId, 'eaten');

    const result = await footprint();
    expect(result.rescued.count).toBe(1);
    expect(result.rescued.grams).toBeGreaterThan(0);
    expect(result.rescued.co2eGrams).toBeGreaterThan(0);
    // Milk: 3.703 kg CO2e per kg, so 500 g make 1852 g.
    expect(result.wasted).toMatchObject({ count: 1, grams: 500 });
    expect(result.wasted.co2eGrams).toBe(Math.round(3.703 * 500));
    expect(result.topCategories.map((entry) => entry.categoryId)).toEqual(['dairy-yoghurt']);
  });

  it('does not count an undone outcome', async () => {
    const { itemId } = await add('Vollmilch', {
      expiresOn: '2026-11-03',
      quantity: 500,
      unit: 'ml',
    });
    const { eventId } = await close(itemId, 'wasted');
    await inventory['inventory.undoOutcome']({ commandId: next(), householdId, eventId });
    expect((await footprint()).wasted.count).toBe(0);
  });

  it('counts a processed ingredient only through its result', async () => {
    const milk = await add('Vollmilch', { expiresOn: '2026-11-07', quantity: 500, unit: 'ml' });
    await inventory['inventory.process']({
      commandId: next(),
      householdId,
      ingredients: [{ itemId: milk.itemId }],
      result: { name: 'Griessbrei', kind: 'made' },
    });
    // The ingredient's outcome carries `madeInto`: the milk counts nowhere yet.
    const result = await footprint();
    expect(result.rescued.count).toBe(0);
    expect(result.wasted.count).toBe(0);
  });

  it('gives a Kehricht estimate for CHF households and none for others', async () => {
    const { itemId } = await add('Vollmilch', {
      expiresOn: '2026-11-03',
      quantity: 489,
      unit: 'ml',
    });
    await close(itemId, 'eaten', true);
    expect((await footprint()).kehricht).toEqual({ bags: 0.1, feeRappen: 16 });

    await storage.households.add(
      HouseholdSchema.parse({
        id: householdId,
        updatedAt: now,
        name: 'WG',
        plan: 'free',
        currency: CurrencyCodeSchema.parse('EUR'),
        createdAt: now,
      }),
    );
    expect((await footprint()).kehricht).toBeNull();
  });
});
