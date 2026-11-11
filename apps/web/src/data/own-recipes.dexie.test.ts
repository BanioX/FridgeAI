import 'fake-indexeddb/auto';
import {
  createRecipeCommands,
  createRecipeQueries,
  localDate,
  type Id,
  type OperationInput,
  type RecipeCommands,
  type RecipeQueries,
} from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import { appContext } from './command';
import type { FridgeDb } from './db';
import { createInventoryHandlers, type InventoryHandlers } from './handlers';
import { createHouseholdHandlers, type HouseholdHandlers } from './household-handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

let db: FridgeDb;
let inventory: InventoryHandlers;
let recipes: RecipeQueries;
let commands: RecipeCommands;
let household: HouseholdHandlers;
let householdId: Id;
let ids: ReturnType<typeof sequentialIds>;
const clock = fixedClock('2026-11-11T09:00:00.000Z', '2026-11-11');

beforeEach(async () => {
  db = testDb();
  ids = sequentialIds();
  const profile = await ensureLocalHousehold(db, clock, ids, { household: 'WG', member: 'Lena' });
  householdId = profile.household.id;
  const ctx = { db, clock, ids, actor: profile.member.id };
  inventory = createInventoryHandlers(ctx);
  recipes = createRecipeQueries(appContext(ctx));
  commands = createRecipeCommands(appContext(ctx));
  household = createHouseholdHandlers(ctx);
});

const create = () =>
  commands['recipes.create']({
    commandId: ids.next(),
    householdId,
    title: 'Milchreis',
    minutes: 40,
    servings: 2,
    ingredients: ['1 l Milch', '200 g Reis'],
    steps: ['1. Milch erwärmen', '2. Reis dazugeben'],
  });

describe('own recipes on Dexie (ADR-0048, point 7)', () => {
  it('saves, ranks with the Vorrat, updates and deletes', async () => {
    const { recipeId } = await create();
    expect(await db.ownRecipes.count()).toBe(1);

    await inventory['inventory.addItem']({
      commandId: ids.next(),
      householdId,
      name: 'Vollmilch',
      location: 'fridge',
      quantity: 1,
      expiresOn: localDate('2026-11-12'),
    });
    const { recipes: suggested } = await recipes['recipes.suggest']({ householdId, limit: 10 });
    expect(suggested.find((entry) => entry.id === recipeId)).toMatchObject({
      id: recipeId,
      source: 'own',
      usesExpiring: ['Vollmilch'],
      missing: ['200 g Reis'],
    });

    await commands['recipes.update']({
      commandId: ids.next(),
      householdId,
      recipeId,
      title: 'Reisbrei',
      ingredients: ['Reis'],
      steps: [],
    });
    expect((await recipes['recipes.get']({ householdId, recipeId })).recipe?.title).toBe(
      'Reisbrei',
    );

    await commands['recipes.delete']({ commandId: ids.next(), householdId, recipeId });
    expect((await recipes['recipes.get']({ householdId, recipeId })).recipe).toBeNull();
    expect(await db.events.where('type').startsWith('recipe.').count()).toBe(3);
  });

  it('round-trips through export, delete and import', async () => {
    const { recipeId } = await create();
    const gone = await create();
    await commands['recipes.delete']({
      commandId: ids.next(),
      householdId,
      recipeId: gone.recipeId,
    });

    const file = JSON.parse(
      JSON.stringify(await household['household.export']({ householdId })),
    ) as OperationInput<'household.import'>['data'];
    expect(file.ownRecipes).toHaveLength(2);

    // «Alles löschen» takes the recipes with it.
    await household['household.delete']({
      commandId: ids.next(),
      householdId,
      confirm: true,
    });
    expect(await db.ownRecipes.count()).toBe(0);

    const fresh = await ensureLocalHousehold(db, clock, ids, { household: 'Neu', member: 'Ich' });
    await createHouseholdHandlers({
      db,
      clock,
      ids,
      actor: fresh.member.id,
    })['household.import']({
      commandId: ids.next(),
      householdId: fresh.household.id,
      data: file,
      confirm: true,
    });

    expect(await db.ownRecipes.count()).toBe(2);
    const back = await recipes['recipes.get']({ householdId, recipeId });
    expect(back.recipe).toMatchObject({ title: 'Milchreis', source: 'own', minutes: 40 });
    expect(back.recipe?.ingredients.map((entry) => entry.text)).toEqual([
      '1 l Milch',
      '200 g Reis',
    ]);
    // The deleted one stays deleted.
    expect(
      (await recipes['recipes.get']({ householdId, recipeId: gone.recipeId })).recipe,
    ).toBeNull();
  });
});
