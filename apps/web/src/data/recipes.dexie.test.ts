import 'fake-indexeddb/auto';
import {
  createRecipeQueries,
  createShoppingUseCases,
  localDate,
  type Id,
  type RecipeQueries,
  type ShoppingUseCases,
} from '@fridgeai/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import { appContext } from './command';
import type { FridgeDb } from './db';
import { createInventoryHandlers, type InventoryHandlers } from './handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

let db: FridgeDb;
let inventory: InventoryHandlers;
let recipes: RecipeQueries;
let shopping: ShoppingUseCases;
let householdId: Id;
let ids: ReturnType<typeof sequentialIds>;

beforeEach(async () => {
  db = testDb();
  ids = sequentialIds();
  const clock = fixedClock('2026-11-06T09:00:00.000Z', '2026-11-06');
  const profile = await ensureLocalHousehold(db, clock, ids, { household: 'WG', member: 'Lena' });
  householdId = profile.household.id;
  const ctx = { db, clock, ids, actor: profile.member.id };
  inventory = createInventoryHandlers(ctx);
  recipes = createRecipeQueries(appContext(ctx));
  shopping = createShoppingUseCases(appContext(ctx));
});

const add = (name: string, expiresOn: string) =>
  inventory['inventory.addItem']({
    commandId: ids.next(),
    householdId,
    name,
    location: 'fridge',
    quantity: 1,
    expiresOn: localDate(expiresOn),
  });

describe('recipes', () => {
  it('suggests recipes for what expires soon, not for deleted food', async () => {
    expect((await recipes['recipes.suggest']({ householdId })).recipes).toEqual([]);
    await add('Bananen', '2026-11-06');
    await add('Vollmilch', '2026-11-07');
    const deleted = await add('Hackfleisch', '2026-11-06');
    await inventory['inventory.deleteItem']({
      commandId: ids.next(),
      householdId,
      itemId: deleted.itemId,
    });

    const { recipes: suggested } = await recipes['recipes.suggest']({ householdId, limit: 5 });
    expect(suggested[0]).toMatchObject({
      id: 'bananen-pancakes',
      usesExpiring: ['Bananen', 'Vollmilch'],
    });
    expect(suggested.some((recipe) => recipe.id === 'hackfleisch-teigwaren')).toBe(false);
  });

  it('lists all recipes, those that need least first, and filters by tag', async () => {
    const before = (await recipes['recipes.list']({ householdId })).recipes;
    for (const name of ['Bananen', 'Vollmilch', 'Freilandeier']) {
      await add(name, '2026-11-20');
    }
    const { recipes: all } = await recipes['recipes.list']({ householdId });
    expect(all).toHaveLength(before.length);
    const pancakes = all.findIndex((recipe) => recipe.id === 'bananen-pancakes');
    expect(all[pancakes]?.missing).toEqual([]);
    expect(all.slice(0, pancakes).every((recipe) => recipe.missing.length === 0)).toBe(true);

    const { recipes: vegan } = await recipes['recipes.list']({ householdId, tag: 'vegan' });
    expect(vegan.length).toBeGreaterThan(0);
    expect(vegan.every((recipe) => recipe.tags.includes('vegan'))).toBe(true);
  });

  it('shows a recipe with what is at home and says null for unknown ids', async () => {
    await add('Freilandeier', '2026-11-12');
    const { recipe } = await recipes['recipes.get']({ householdId, recipeId: 'bananen-pancakes' });
    expect(recipe?.title).toBe('Bananen-Pancakes');
    expect(recipe?.ingredients.find((entry) => entry.text === '2 Eier')?.atHome).toEqual([
      expect.objectContaining({ name: 'Freilandeier', unit: 'pcs', expiresOn: '2026-11-12' }),
    ]);
    expect(recipe?.steps.length).toBeGreaterThan(0);
    expect(await recipes['recipes.get']({ householdId, recipeId: 'gibt-es-nicht' })).toEqual({
      recipe: null,
    });
  });

  it('puts what is missing for a recipe on the list, once', async () => {
    await add('Vollmilch', '2026-11-07');
    const { recipe } = await recipes['recipes.get']({ householdId, recipeId: 'bananen-pancakes' });
    const missing = (recipe?.ingredients ?? []).filter(
      (entry) => !entry.staple && !entry.optional && entry.atHome.length === 0,
    );
    expect(missing.map((entry) => entry.text)).toEqual(['2 reife Bananen', '2 Eier']);
    for (const entry of missing) {
      await shopping['shopping.addItem']({
        commandId: ids.next(),
        householdId,
        name: entry.text,
      });
    }
    const { items } = await shopping['shopping.list']({ householdId, includeChecked: false });
    expect(items.map((item) => item.name)).toEqual(['2 reife Bananen', '2 Eier']);
  });
});
