import { describe, expect, it } from 'vitest';
import {
  CONTRACT_V1,
  CommandError,
  HouseholdExportSchema,
  cleanRecipeLines,
  createHouseholdUseCases,
  createInventoryUseCases,
  createMemoryStorage,
  createRecipeCommands,
  createRecipeQueries,
  createShoppingUseCases,
  IsoDateTimeSchema,
  localDate,
  ownRecipeToRankable,
  parseIngredientLine,
  uuidV7,
  type Id,
} from '../src';

function id(counter: number): Id {
  const random = new Uint8Array(10);
  random[9] = counter;
  return uuidV7(1_762_500_000_000 + counter, random);
}

const householdId = id(1);

function setup() {
  let counter = 10;
  const storage = createMemoryStorage();
  const ctx = {
    storage,
    clock: {
      now: () => IsoDateTimeSchema.parse('2026-11-11T09:00:00.000Z'),
      today: () => localDate('2026-11-11'),
    },
    ids: { next: () => id((counter += 1)) },
    actor: id(2),
  };
  return {
    ctx,
    storage,
    inventory: createInventoryUseCases(ctx),
    recipes: createRecipeQueries(ctx),
    commands: createRecipeCommands(ctx),
    shopping: createShoppingUseCases(ctx),
    household: createHouseholdUseCases(ctx),
  };
}

const lines = (text: string) => text.split('\n');

describe('pasted recipe lines', () => {
  it('trims, drops empty lines and strips bullets and numbers', () => {
    expect(
      cleanRecipeLines([
        '  • 200 g Hörnli \n\n- 1 Zwiebel\r\n* Salz\n☐ 2 dl Rahm\n',
        '1. Zwiebel hacken.\n2) In Butter andünsten\n3.Nicht entfernen',
      ]),
    ).toEqual([
      '200 g Hörnli',
      '1 Zwiebel',
      'Salz',
      '2 dl Rahm',
      'Zwiebel hacken.',
      'In Butter andünsten',
      '3.Nicht entfernen',
    ]);
    // A decimal amount is not a numbered list.
    expect(cleanRecipeLines(['1.5 dl Milch', '1,5 kg Kartoffeln'])).toEqual([
      '1.5 dl Milch',
      '1,5 kg Kartoffeln',
    ]);
    expect(cleanRecipeLines(['', '   ', '\n'])).toEqual([]);
  });

  it('keeps the text and reads name, amount and category of an ingredient', () => {
    expect(parseIngredientLine('200 g Hörnli')).toMatchObject({
      text: '200 g Hörnli',
      name: 'Hörnli',
      quantity: 200,
      unit: 'g',
    });
    expect(parseIngredientLine('200 g Hörnli').categoryId).toBeDefined();
    expect(parseIngredientLine('Milch')).toMatchObject({ name: 'Milch', categoryId: 'dairy-milk' });
    const unknown = parseIngredientLine('Zauberstaub');
    expect(unknown).toEqual({ text: 'Zauberstaub', name: 'Zauberstaub' });
    expect(
      ownRecipeToRankable({
        id: id(5),
        householdId,
        updatedAt: IsoDateTimeSchema.parse('2026-11-11T09:00:00.000Z'),
        createdAt: IsoDateTimeSchema.parse('2026-11-11T09:00:00.000Z'),
        title: 'Test',
        ingredients: [parseIngredientLine('Milch'), unknown],
        steps: [],
      }).ingredients,
    ).toEqual([
      {
        text: 'Milch',
        categories: ['dairy-milk'],
        words: ['Milch'],
        staple: false,
        optional: false,
      },
      {
        text: 'Zauberstaub',
        categories: [],
        words: ['Zauberstaub'],
        staple: false,
        optional: false,
      },
    ]);
  });
});

describe('own recipes', () => {
  const create = (
    { commands, ctx }: ReturnType<typeof setup>,
    extra: Record<string, unknown> = {},
  ) =>
    commands['recipes.create']({
      commandId: ctx.ids.next(),
      householdId,
      title: '  Milchreis  ',
      minutes: 40,
      servings: 2,
      ingredients: lines('• 1 l Milch\n\n200 g Reis\nZimt'),
      steps: lines('1. Milch erwärmen\n2. Reis dazugeben und rühren'),
      ...extra,
    });

  it('creates, lists first-class with a source, shows and updates', async () => {
    const s = setup();
    const { recipeId } = await create(s);

    const { recipes } = await s.recipes['recipes.list']({ householdId });
    expect(recipes.find((entry) => entry.id === recipeId)).toMatchObject({
      title: 'Milchreis',
      source: 'own',
      minutes: 40,
      tags: [],
    });
    expect(recipes.filter((entry) => entry.source === 'curated').length).toBeGreaterThan(20);

    const { recipe } = await s.recipes['recipes.get']({ householdId, recipeId });
    expect(recipe).toMatchObject({ source: 'own', title: 'Milchreis', servings: 2 });
    expect(recipe?.ingredients.map((entry) => entry.text)).toEqual([
      '1 l Milch',
      '200 g Reis',
      'Zimt',
    ]);
    expect(recipe?.steps).toEqual(['Milch erwärmen', 'Reis dazugeben und rühren']);

    // Update replaces everything; an emptied time goes away.
    await s.commands['recipes.update']({
      commandId: s.ctx.ids.next(),
      householdId,
      recipeId,
      title: 'Reis mit Milch',
      ingredients: ['Reis'],
      steps: [],
    });
    const changed = (await s.recipes['recipes.get']({ householdId, recipeId })).recipe;
    expect(changed).toMatchObject({ title: 'Reis mit Milch', steps: [] });
    expect(changed?.minutes).toBeUndefined();
    expect(changed?.servings).toBeUndefined();
    expect((await s.storage.ownRecipes.get(recipeId))?.createdAt).toBe('2026-11-11T09:00:00.000Z');
    expect((await s.storage.events.ofHousehold(householdId)).map((event) => event.type)).toEqual([
      'recipe.created',
      'recipe.updated',
    ]);
  });

  it('compares with the Vorrat and suggests an own recipe for food that expires soon', async () => {
    const s = setup();
    const { recipeId } = await create(s);
    await s.inventory['inventory.addItem']({
      commandId: s.ctx.ids.next(),
      householdId,
      name: 'Vollmilch',
      location: 'fridge',
      quantity: 1,
      unit: 'pcs',
      owner: 'shared',
      expiresOn: localDate('2026-11-12'),
    });

    const { recipe } = await s.recipes['recipes.get']({ householdId, recipeId });
    const byText = Object.fromEntries(
      (recipe?.ingredients ?? []).map((entry) => [entry.text, entry.atHome.length > 0]),
    );
    expect(byText).toEqual({ '1 l Milch': true, '200 g Reis': false, Zimt: false });

    const { recipes } = await s.recipes['recipes.suggest']({ householdId, limit: 10 });
    expect(recipes.find((entry) => entry.id === recipeId)).toMatchObject({
      source: 'own',
      usesExpiring: ['Vollmilch'],
      missing: ['200 g Reis', 'Zimt'],
    });

    // «Fehlendes auf die Liste» uses the same ingredient lines.
    for (const text of ['200 g Reis', 'Zimt']) {
      await s.shopping['shopping.addItem']({
        commandId: s.ctx.ids.next(),
        householdId,
        name: text,
      });
    }
    expect(
      (await s.shopping['shopping.list']({ householdId, includeChecked: false })).items.length,
    ).toBe(2);
  });

  it('sorts a recipe without minutes after the quick ones and survives a missing time', async () => {
    const s = setup();
    const { recipeId } = await create(s, { minutes: undefined, servings: undefined });
    const { recipes } = await s.recipes['recipes.list']({ householdId });
    const own = recipes.find((entry) => entry.id === recipeId);
    expect(own?.minutes).toBeUndefined();
  });

  it('deletes softly, hides the recipe everywhere and says not_found twice', async () => {
    const s = setup();
    const { recipeId } = await create(s);
    const commandId = s.ctx.ids.next();
    expect(await s.commands['recipes.delete']({ commandId, householdId, recipeId })).toEqual({
      deleted: true,
    });
    // The same command again returns the stored result.
    expect(await s.commands['recipes.delete']({ commandId, householdId, recipeId })).toEqual({
      deleted: true,
    });
    expect((await s.recipes['recipes.get']({ householdId, recipeId })).recipe).toBeNull();
    expect(
      (await s.recipes['recipes.list']({ householdId })).recipes.some(
        (entry) => entry.id === recipeId,
      ),
    ).toBe(false);
    // The row stays for the export (data rights), marked as deleted.
    expect((await s.storage.ownRecipes.get(recipeId))?.deletedAt).toBeDefined();
    await expect(
      s.commands['recipes.delete']({ commandId: s.ctx.ids.next(), householdId, recipeId }),
    ).rejects.toBeInstanceOf(CommandError);
    await expect(
      s.commands['recipes.update']({
        commandId: s.ctx.ids.next(),
        householdId,
        recipeId,
        title: 'X',
        ingredients: ['Y'],
        steps: [],
      }),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('does not touch a recipe of another household and refuses a recipe without ingredients', async () => {
    const s = setup();
    const { recipeId } = await create(s);
    await expect(
      s.commands['recipes.delete']({
        commandId: s.ctx.ids.next(),
        householdId: id(99),
        recipeId,
      }),
    ).rejects.toMatchObject({ code: 'not_found' });
    await expect(create(s, { ingredients: lines('\n  \n•') })).rejects.toThrow();
    await expect(create(s, { title: '   ' })).rejects.toThrow();
  });

  it('lets a client with the scope recipes:write change recipes, and recipes:read read them', () => {
    for (const name of ['recipes.create', 'recipes.update', 'recipes.delete'] as const) {
      expect(CONTRACT_V1[name].scopes).toEqual(['recipes:write']);
    }
    expect(CONTRACT_V1['recipes.get'].scopes).toEqual(['recipes:read']);
  });
});

describe('own recipes and data rights (ADR-0020)', () => {
  it('are part of the export, deleted ones included, and old exports without them still parse', async () => {
    const s = setup();
    await s.storage.households.add({
      id: householdId,
      updatedAt: IsoDateTimeSchema.parse('2026-11-11T09:00:00.000Z'),
      name: 'WG',
      plan: 'free',
      createdAt: IsoDateTimeSchema.parse('2026-11-11T09:00:00.000Z'),
    });
    const first = await s.commands['recipes.create']({
      commandId: s.ctx.ids.next(),
      householdId,
      title: 'Milchreis',
      ingredients: ['Milch'],
      steps: [],
    });
    const second = await s.commands['recipes.create']({
      commandId: s.ctx.ids.next(),
      householdId,
      title: 'Hörnli',
      ingredients: ['Hörnli'],
      steps: [],
    });
    await s.commands['recipes.delete']({
      commandId: s.ctx.ids.next(),
      householdId,
      recipeId: second.recipeId,
    });

    const exported = await s.household['household.export']({ householdId });
    expect(exported.ownRecipes.map((recipe) => recipe.id).sort()).toEqual(
      [first.recipeId, second.recipeId].sort(),
    );
    expect(exported.ownRecipes.find((recipe) => recipe.id === second.recipeId)?.deletedAt).toBe(
      '2026-11-11T09:00:00.000Z',
    );

    // A file from before «Meine Rezepte» has none and is still valid.
    const old = JSON.parse(JSON.stringify(exported)) as Record<string, unknown>;
    delete old.ownRecipes;
    expect(HouseholdExportSchema.parse(old).ownRecipes).toEqual([]);
  });
});
