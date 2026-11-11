import { describe, expect, it } from 'vitest';
import {
  createInventoryUseCases,
  createMemoryStorage,
  createRecipeQueries,
  IsoDateTimeSchema,
  localDate,
  uuidV7,
  type Id,
} from '../src';

/** The recipe queries on memory storage: no browser, no database (ADR-0034, ADR-0048). */
function id(counter: number): Id {
  const random = new Uint8Array(10);
  random[9] = counter;
  return uuidV7(1_762_500_000_000 + counter, random);
}

function setup() {
  let counter = 10;
  const ctx = {
    storage: createMemoryStorage(),
    clock: {
      now: () => IsoDateTimeSchema.parse('2026-11-11T09:00:00.000Z'),
      today: () => localDate('2026-11-11'),
    },
    ids: { next: () => id((counter += 1)) },
    actor: id(2),
  };
  return { ctx, inventory: createInventoryUseCases(ctx), recipes: createRecipeQueries(ctx) };
}

const householdId = id(1);

describe('recipe queries', () => {
  it('suggests nothing for an empty Vorrat and the whole collection as a list', async () => {
    const { recipes } = setup();
    expect((await recipes['recipes.suggest']({ householdId })).recipes).toEqual([]);
    expect((await recipes['recipes.list']({ householdId })).recipes.length).toBeGreaterThan(20);
  });

  it('rescues what expires soon and shows what is at home on the recipe', async () => {
    const { ctx, inventory, recipes } = setup();
    await inventory['inventory.addItem']({
      commandId: ctx.ids.next(),
      householdId,
      name: 'Vollmilch',
      location: 'fridge',
      quantity: 1,
      unit: 'pcs',
      owner: 'shared',
      expiresOn: localDate('2026-11-12'),
    });
    const { recipes: suggested } = await recipes['recipes.suggest']({ householdId, limit: 3 });
    expect(suggested.length).toBeGreaterThan(0);
    expect(suggested.every((entry) => entry.usesExpiring.includes('Vollmilch'))).toBe(true);

    const { recipe } = await recipes['recipes.get']({ householdId, recipeId: 'bananen-pancakes' });
    expect(recipe?.ingredients.some((entry) => entry.atHome.length > 0)).toBe(true);
    expect(await recipes['recipes.get']({ householdId, recipeId: 'nope' })).toEqual({
      recipe: null,
    });
  });
});
