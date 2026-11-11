import { beforeEach, describe, expect, it } from 'vitest';
import {
  CONTRACT_V1,
  createHouseholdUseCases,
  createInventoryUseCases,
  createMemoryStorage,
  HouseholdSchema,
  IsoDateTimeSchema,
  localDate,
  matchCategoryByName,
  rappen,
  summarizeImpact,
  uuidV7,
  type Id,
  type Storage,
} from '../src';

/** «Verarbeiten» (ADR-0051) on memory storage: the value moves along and is never counted twice. */
let storage: Storage;
let inventory: ReturnType<typeof createInventoryUseCases>;
let exporter: ReturnType<typeof createHouseholdUseCases>;
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
  const ctx = {
    storage,
    clock: { now: () => now, today: () => localDate('2026-11-07') },
    ids: { next },
    actor,
  };
  inventory = createInventoryUseCases(ctx);
  exporter = createHouseholdUseCases(ctx);
});

const add = (name: string, fields: Record<string, unknown> = {}) =>
  inventory['inventory.addItem']({
    commandId: next(),
    householdId,
    name,
    location: 'pantry',
    ...fields,
  });

const process = (fields: Record<string, unknown>) =>
  inventory['inventory.process']({
    commandId: next(),
    householdId,
    ingredients: [],
    ...fields,
  } as never);

const stats = () => inventory['stats.waste']({ householdId, from, to });

async function bakeCake() {
  const flour = await add('Mehl', { priceRappen: 150 });
  const eggs = await add('Eier', { priceRappen: 400 });
  const butter = await add('Butter', {}); // no price: estimated
  const done = await process({
    ingredients: [{ itemId: flour.itemId }, { itemId: eggs.itemId }, { itemId: butter.itemId }],
    result: { name: 'Schokoladenkuchen', kind: 'made' },
  });
  return { flour, eggs, butter, done };
}

describe('inventory.process', () => {
  it('uses the ingredients up and makes a new item whose value is their sum', async () => {
    const { flour, done } = await bakeCake();
    expect(done.outcomeIds).toHaveLength(3);
    expect(done.valueEstimated).toBe(true);
    const cake = await storage.items.get(done.resultItemId as Id);
    expect(cake).toMatchObject({
      origin: 'made',
      location: 'fridge',
      status: 'active',
      priceRappen: done.valueRappen,
      priceEstimated: true,
      expiryKind: 'best_before',
    });
    expect(cake?.madeFrom).toHaveLength(3);
    expect(cake?.expiresOn).toBe('2026-11-10'); // fridge 3 days
    expect((await storage.items.get(flour.itemId))?.status).toBe('eaten');
    const outcomes = await storage.outcomes.ofHousehold(householdId);
    expect(outcomes.every((outcome) => outcome.madeInto === cake?.id)).toBe(true);
    const product = await storage.products.get(cake?.productId as Id);
    expect(product?.categoryId).toBe('bakery-homemade');
    // The view names the ingredients.
    const view = (await inventory['inventory.list']({ householdId })).items.find(
      (entry) => entry.id === cake?.id,
    );
    expect(view).toMatchObject({ origin: 'made', madeFrom: ['Mehl', 'Eier', 'Butter'] });
  });

  it('takes only a part of an ingredient and keeps the rest', async () => {
    const flour = await add('Mehl', { priceRappen: 200, quantity: 4, unit: 'pcs' });
    const done = await process({
      ingredients: [{ itemId: flour.itemId, quantity: 1 }],
      result: { name: 'Brot', kind: 'made', location: 'pantry' },
    });
    expect(done.valueRappen).toBe(50);
    const rest = await storage.items.get(flour.itemId);
    expect(rest).toMatchObject({ status: 'active', quantity: 3, priceRappen: 150 });
    await expect(
      process({ ingredients: [{ itemId: flour.itemId, quantity: 9 }] }),
    ).rejects.toMatchObject({ code: 'invalid_quantity' });
    // Failed validation left nothing half done.
    expect((await storage.items.get(flour.itemId))?.quantity).toBe(3);
  });

  it('makes leftovers from nothing: name only, 3 days, no value of its own', async () => {
    const done = await process({ result: { name: 'Reste: Lasagne', kind: 'leftover' } });
    expect(done.outcomeIds).toEqual([]);
    const item = await storage.items.get(done.resultItemId as Id);
    expect(item).toMatchObject({ origin: 'leftover', expiryKind: 'use_by', location: 'fridge' });
    expect(item?.priceRappen).toBeUndefined();
    expect(item?.expiresOn).toBe('2026-11-10');
    expect((await storage.products.get(item?.productId as Id))?.categoryId).toBe(
      'prepared-leftovers',
    );
  });

  it('needs ingredients or a result, each ingredient only once', () => {
    const input = CONTRACT_V1['inventory.process'].input;
    expect(input.safeParse({ commandId: id(3), householdId, ingredients: [] }).success).toBe(false);
    expect(
      input.safeParse({
        commandId: id(3),
        householdId,
        ingredients: [{ itemId: id(4) }, { itemId: id(4) }],
      }).success,
    ).toBe(false);
  });

  it('is idempotent and rejects items that are already closed', async () => {
    const flour = await add('Mehl');
    const commandId = next();
    const input = { commandId, householdId, ingredients: [{ itemId: flour.itemId }] };
    const first = await inventory['inventory.process'](input);
    expect(await inventory['inventory.process'](input)).toEqual(first);
    await expect(process({ ingredients: [{ itemId: flour.itemId }] })).rejects.toMatchObject({
      code: 'not_active',
    });
  });

  it('writes item.processed with everything the badges need', async () => {
    const { done } = await bakeCake();
    const cooked = await add('Reis');
    await process({ ingredients: [{ itemId: cooked.itemId }], recipeId: 'risotto' });
    await process({
      recipeId: 'risotto',
      result: { name: 'Reste: Risotto', kind: 'leftover' },
    });
    const processed = (await storage.events.ofHousehold(householdId)).filter(
      (event) => event.type === 'item.processed',
    );
    expect(processed.map((event) => event.payload)).toMatchObject([
      {
        kind: 'made',
        resultId: done.resultItemId,
        ingredientIds: [expect.any(String), expect.any(String), expect.any(String)],
      },
      { kind: 'cooked', recipeId: 'risotto', ingredientIds: [cooked.itemId] },
      { kind: 'leftover', recipeId: 'risotto', ingredientIds: [] },
    ]);
    expect(processed[1]?.payload).not.toHaveProperty('resultId');
  });
});

describe('honest numbers: the value moves along', () => {
  it('counts a cake that was verwertet once, with the sum of the ingredients', async () => {
    const { done } = await bakeCake();
    // The ingredients are in no value sum yet.
    expect(await stats()).toMatchObject({ usedRappen: 0, usedCount: 0, wastedRappen: 0 });
    await inventory['inventory.recordOutcome']({
      commandId: next(),
      householdId,
      itemId: done.resultItemId as Id,
      outcome: 'eaten',
    });
    expect(await stats()).toMatchObject({
      usedRappen: done.valueRappen,
      usedCount: 1,
      wastedRappen: 0,
      estimated: true,
    });
  });

  it("counts a cake that was entsorgt once, as waste of the ingredients' value", async () => {
    const { done } = await bakeCake();
    await inventory['inventory.recordOutcome']({
      commandId: next(),
      householdId,
      itemId: done.resultItemId as Id,
      outcome: 'wasted',
      wasteReason: 'too_much',
    });
    expect(await stats()).toMatchObject({
      wastedRappen: done.valueRappen,
      wastedCount: 1,
      usedRappen: 0,
      usedCount: 0,
    });
  });

  it('counts the ingredients as verwertet when nothing is left', async () => {
    const flour = await add('Mehl', { priceRappen: 150 });
    const eggs = await add('Eier', { priceRappen: 400 });
    const done = await process({
      ingredients: [{ itemId: flour.itemId }, { itemId: eggs.itemId }],
      recipeId: 'omelette',
    });
    expect(done.resultItemId).toBeUndefined();
    expect(await stats()).toMatchObject({ usedRappen: 550, usedCount: 2 });
  });

  it('applies the rule in summarizeImpact for rescue and value alike', () => {
    const outcome = {
      outcome: 'eaten' as const,
      valueRappen: rappen(500),
      valueEstimated: false,
      at: now,
      rescued: true,
    };
    const summary = summarizeImpact(
      [outcome, { ...outcome, madeInto: id(5) }, { ...outcome, madeInto: id(5), outcome: 'eaten' }],
      from,
      to,
    );
    expect(summary).toMatchObject({ savedRappen: 500, savedCount: 1, usedRappen: 500 });
  });

  it('gives the value back when the outcomes are undone', async () => {
    const { done, flour } = await bakeCake();
    for (const eventId of done.outcomeIds) {
      await inventory['inventory.undoOutcome']({ commandId: next(), householdId, eventId });
    }
    await inventory['inventory.deleteItem']({
      commandId: next(),
      householdId,
      itemId: done.resultItemId as Id,
    });
    expect((await storage.items.get(flour.itemId))?.status).toBe('active');
    expect(await stats()).toMatchObject({ usedRappen: 0, usedCount: 0 });
    expect((await inventory['inventory.list']({ householdId })).items).toHaveLength(3);
  });

  it('keeps an estimated price after undoing an outcome of a made item', async () => {
    const { done } = await bakeCake();
    const eaten = await inventory['inventory.recordOutcome']({
      commandId: next(),
      householdId,
      itemId: done.resultItemId as Id,
      outcome: 'eaten',
      quantity: 0.5,
    });
    expect(eaten.valueEstimated).toBe(true);
    await inventory['inventory.undoOutcome']({
      commandId: next(),
      householdId,
      eventId: eaten.eventId,
    });
    expect((await storage.items.get(done.resultItemId as Id))?.priceRappen).toBe(done.valueRappen);
  });
});

describe('categories of made food', () => {
  it('recognises «Brot selbst gemacht», «Zopf selbst gemacht» and «Reste: …»', () => {
    expect(matchCategoryByName('Brot selbst gemacht')?.id).toBe('bakery-homemade');
    expect(matchCategoryByName('Zopf selbst gemacht')?.id).toBe('bakery-homemade');
    expect(matchCategoryByName('Reste: Lasagne')?.id).toBe('prepared-leftovers');
    // Bought stays bought.
    expect(matchCategoryByName('Zopf')?.id).toBe('bakery-bread');
    expect(matchCategoryByName('Kuchen')?.id).toBe('bakery-pastry');
    expect(matchCategoryByName('Lasagne')?.id).not.toBe('prepared-leftovers');
  });
});

describe('data rights', () => {
  it('exports the new fields and old files without them still parse', async () => {
    await storage.households.add(
      HouseholdSchema.parse({
        id: householdId,
        updatedAt: now,
        name: 'WG',
        plan: 'free',
        createdAt: now,
      }),
    );
    const { done } = await bakeCake();
    const data = await exporter['household.export']({ householdId });
    const cake = data.items.find((item) => item.id === done.resultItemId);
    expect(cake).toMatchObject({ origin: 'made', priceEstimated: true });
    expect(data.outcomes.filter((outcome) => outcome.madeInto === cake?.id)).toHaveLength(3);
    // Round trip through JSON, as the file does.
    const again = CONTRACT_V1['household.export'].output.parse(JSON.parse(JSON.stringify(data)));
    expect(again.items).toEqual(data.items);
    expect(again.outcomes).toEqual(data.outcomes);
    // An old export has none of the new fields.
    const old = JSON.parse(JSON.stringify(data)) as typeof data;
    for (const item of old.items) {
      delete (item as { origin?: unknown }).origin;
      delete (item as { madeFrom?: unknown }).madeFrom;
      delete (item as { priceEstimated?: unknown }).priceEstimated;
    }
    for (const outcome of old.outcomes) {
      delete (outcome as { madeInto?: unknown }).madeInto;
    }
    expect(CONTRACT_V1['household.export'].output.safeParse(old).success).toBe(true);
  });
});
