import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/catalog/categories';
import { localDate } from '../src/dates';
import type { DateKind } from '../src/model/primitives';
import {
  fitsFeierabend,
  ingredientsAtHome,
  listRecipes,
  matchesIngredient,
  recipesForChosen,
  RecipeSchema,
  suggestRecipes,
  type FoodAtHome,
  type Recipe,
} from '../src/recipes/recipe';
import { RECIPES } from '../src/recipes/recipes.de-CH';
import { matchCategoryByName } from '../src/catalog/match';
import { ownRecipeToRankable, parseIngredientLine } from '../src/recipes/own-recipe';

const today = localDate('2026-11-06');

const food = (
  name: string,
  categoryId: string,
  expiresOn: string,
  expiryKind: DateKind = 'best_before',
): FoodAtHome => ({
  name,
  categoryId: categoryId,
  expiresOn: localDate(expiresOn),
  expiryKind,
});

const recipe = (id: string, minutes: number, ingredients: unknown[]): Recipe =>
  RecipeSchema.parse({
    id,
    title: id,
    minutes,
    servings: 2,
    ingredients,
    steps: ['Alles kochen.'],
  });

const omelette = recipe('omelette', 10, [
  { text: 'Eier', categories: ['dairy-eggs'] },
  { text: 'Spinat', words: ['spinat'] },
  { text: 'Käse', categories: ['dairy-cheese-hard'], optional: true },
  { text: 'Salz', staple: true },
]);
const soup = recipe('suppe', 30, [
  { text: 'Karotten', categories: ['produce-carrots'] },
  { text: 'Kartoffeln', categories: ['produce-potatoes'] },
]);

describe('recipe collection', () => {
  it('is valid, uses known categories and has unique ids', () => {
    const known = new Set(CATEGORIES.map((category) => category.id));
    expect(RECIPES.length).toBeGreaterThanOrEqual(25);
    expect(new Set(RECIPES.map((entry) => entry.id)).size).toBe(RECIPES.length);
    for (const entry of RECIPES) {
      for (const ingredient of entry.ingredients) {
        for (const category of ingredient.categories) {
          expect(known.has(category), `${entry.id}: ${category}`).toBe(true);
        }
      }
    }
  });

  it('speaks to one person (du), never «ihr» or «euch»', () => {
    const text = JSON.stringify(RECIPES);
    expect(text).not.toMatch(/\b(ihr|euch|euer|eure)\b/i);
  });
});

describe('suggestRecipes', () => {
  it('rescues the most urgent food first and lists what to buy', () => {
    const atHome = [
      food('Bio Eier', 'dairy-eggs', '2026-11-06'),
      food('Blattspinat', 'produce-salad', '2026-11-07'),
      food('Karotten', 'produce-carrots', '2026-11-08'),
    ];
    expect(suggestRecipes([soup, omelette], atHome, today, 3)).toEqual([
      {
        id: 'omelette',
        title: 'omelette',
        minutes: 10,
        usesExpiring: ['Bio Eier', 'Blattspinat'],
        missing: [],
      },
      {
        id: 'suppe',
        title: 'suppe',
        minutes: 30,
        usesExpiring: ['Karotten'],
        missing: ['Kartoffeln'],
      },
    ]);
  });

  it('suggests nothing without food that expires soon', () => {
    expect(
      suggestRecipes([omelette], [food('Eier', 'dairy-eggs', '2026-11-20')], today, 3),
    ).toEqual([]);
  });

  it('never builds on food past its use-by date, but on past best-before', () => {
    const meat = recipe('hack', 20, [
      { text: 'Hackfleisch', categories: ['meat-minced'] },
      { text: 'Salz', staple: true },
    ]);
    const expired = [food('Hackfleisch', 'meat-minced', '2026-11-05', 'use_by')];
    expect(suggestRecipes([meat], expired, today, 3)).toEqual([]);
    const yoghurt = recipe('bowl', 5, [
      { text: 'Joghurt', categories: ['dairy-yoghurt'] },
      { text: 'Honig', staple: true },
    ]);
    const pastBest = [food('Joghurt', 'dairy-yoghurt', '2026-11-04')];
    expect(suggestRecipes([yoghurt], pastBest, today, 3)[0]?.usesExpiring).toEqual(['Joghurt']);
  });

  it('finds the curated recipes for typical leftovers', () => {
    const atHome = [
      food('Bananen', 'produce-bananas', '2026-11-06'),
      food('Vollmilch', 'dairy-milk', '2026-11-07'),
      food('Eier', 'dairy-eggs', '2026-11-20'),
    ];
    const ids = suggestRecipes(RECIPES, atHome, today, 3).map((entry) => entry.id);
    expect(ids[0]).toBe('bananen-pancakes');
  });
});

describe('listRecipes', () => {
  const quick = RecipeSchema.parse({
    id: 'toast',
    title: 'Toast',
    minutes: 5,
    servings: 1,
    ingredients: [
      { text: 'Brot', words: ['brot'] },
      { text: 'Butter', staple: true },
    ],
    steps: ['Brot toasten.'],
    tags: ['schnell', 'vegetarisch'],
  });

  it('lists every recipe, what can be cooked with the food at home first', () => {
    const atHome = [
      food('Bio Eier', 'dairy-eggs', '2026-11-20'),
      food('Blattspinat', 'produce-salad', '2026-11-07'),
    ];
    expect(listRecipes([soup, quick, omelette], atHome, today)).toEqual([
      {
        id: 'omelette',
        title: 'omelette',
        minutes: 10,
        tags: [],
        usesExpiring: ['Blattspinat'],
        missing: [],
      },
      {
        id: 'toast',
        title: 'Toast',
        minutes: 5,
        tags: ['schnell', 'vegetarisch'],
        usesExpiring: [],
        missing: ['Brot'],
      },
      {
        id: 'suppe',
        title: 'suppe',
        minutes: 30,
        tags: [],
        usesExpiring: [],
        missing: ['Karotten', 'Kartoffeln'],
      },
    ]);
  });

  it('keeps only the recipes with the chosen tag', () => {
    expect(listRecipes([soup, quick, omelette], [], today, 'schnell').map((r) => r.id)).toEqual([
      'toast',
    ]);
  });

  it('calls quick recipes with nothing to buy «Feierabend»', () => {
    expect(fitsFeierabend({ minutes: 15, missing: [] })).toBe(true);
    expect(fitsFeierabend({ minutes: 16, missing: [] })).toBe(false);
    expect(fitsFeierabend({ minutes: 5, missing: ['Brot'] })).toBe(false);
  });

  it('lists the whole collection without food at home', () => {
    expect(listRecipes(RECIPES, [], today)).toHaveLength(RECIPES.length);
  });
});

describe('ingredientsAtHome', () => {
  it('names the food that counts, skips staples and food past use-by', () => {
    const atHome = [
      food('Eier', 'dairy-eggs', '2026-11-10'),
      food('Spinat', 'produce-salad', '2026-11-03', 'use_by'),
    ];
    expect(ingredientsAtHome(omelette, atHome, today)).toEqual([
      { text: 'Eier', staple: false, optional: false, atHome: [atHome[0]] },
      { text: 'Spinat', staple: false, optional: false, atHome: [] },
      { text: 'Käse', staple: false, optional: true, atHome: [] },
      { text: 'Salz', staple: true, optional: false, atHome: [] },
    ]);
  });
});

describe('Zutat oder Fertigprodukt (ADR-0053)', () => {
  /** Food as the app builds it: the category comes from the matcher, as when adding by name. */
  const named = (name: string, readyMade?: boolean): FoodAtHome => ({
    ...food(name, matchCategoryByName(name)?.id ?? 'pantry-other', '2026-11-20'),
    ...(readyMade === undefined ? {} : { readyMade }),
  });
  const found = RECIPES.find((entry) => entry.id === 'birchermuesli');
  const milkOrYoghurt = found?.ingredients[1];
  if (found === undefined || milkOrYoghurt === undefined) {
    throw new Error('Birchermüesli is missing from the collection');
  }
  const bircher = found;

  it('does not let a Skyr Cheesecake stand in for the Joghurt of a Birchermüesli', () => {
    const cheesecake = named('Skyr Cheesecake');
    expect(cheesecake.categoryId).toBe('prepared-desserts');
    const [, joghurt] = ingredientsAtHome(bircher, [cheesecake], today);
    expect(joghurt?.atHome).toEqual([]);
    expect(suggestRecipes([bircher], [cheesecake], today, 3)).toEqual([]);
    const listed = listRecipes([bircher], [cheesecake], today)[0];
    expect(listed?.missing).toContain('2 dl Milch oder Joghurt');
  });

  it('lets an Emmi Skyr Nature count as Joghurt', () => {
    const skyr = named('Emmi Skyr Nature');
    expect(skyr.categoryId).toBe('dairy-yoghurt');
    expect(matchesIngredient(milkOrYoghurt, skyr)).toBe(true);
    const [, joghurt] = ingredientsAtHome(bircher, [skyr], today);
    expect(joghurt?.atHome).toEqual([skyr]);
    expect(listRecipes([bircher], [skyr], today)[0]?.missing).not.toContain(
      '2 dl Milch oder Joghurt',
    );
  });

  it('follows the item over the category in both directions', () => {
    expect(matchesIngredient(milkOrYoghurt, named('Joghurt Nature', true))).toBe(false);
    const dessert = named('Tiramisu', false);
    const tiramisu = { text: 'Tiramisu', categories: ['prepared-desserts'] };
    expect(matchesIngredient(RecipeSchema.shape.ingredients.element.parse(tiramisu), dessert)).toBe(
      true,
    );
  });

  it('counts Oreos for an own recipe that asks for Oreo, but not for Joghurt', () => {
    const oreos = named('Oreo Kekse');
    expect(oreos.categoryId).toBe('pantry-sweets');
    const ownRecipe = ownRecipeToRankable({
      id: 'own-oreo' as never,
      householdId: 'h' as never,
      updatedAt: '2026-11-11T09:00:00.000Z' as never,
      title: 'Oreo Cheesecake',
      ingredients: [parseIngredientLine('200 g Oreo'), parseIngredientLine('2 dl Joghurt')],
      steps: ['Mischen.'],
      createdAt: '2026-11-11T09:00:00.000Z' as never,
    });
    const [oreo, joghurt] = ingredientsAtHome(ownRecipe, [oreos], today);
    expect(oreo?.atHome).toEqual([oreos]);
    expect(joghurt?.atHome).toEqual([]);
  });

  it('reads the ingredient category, not the food name, for the exception', () => {
    // «Oreo» as a bare word does not make a ready food count for a non-ready ingredient.
    const cheesecake = named('Skyr Cheesecake');
    expect(
      matchesIngredient(
        RecipeSchema.shape.ingredients.element.parse({ text: 'Skyr', words: ['skyr'] }),
        cheesecake,
      ),
    ).toBe(false);
  });
});

describe('recipesForChosen (ADR-0061)', () => {
  const at = (
    itemId: string,
    name: string,
    categoryId: string,
    expiresOn: string,
    kind?: DateKind,
  ) => ({
    ...food(name, categoryId, expiresOn, kind),
    itemId,
  });
  const eggs = at('i1', 'Eier', 'dairy-eggs', '2026-11-20');
  const spinach = at('i2', 'Blattspinat', 'produce-leafy', '2026-11-07');
  const potatoes = at('i3', 'Kartoffeln', 'produce-potatoes', '2026-11-30');
  const homeFood = [eggs, spinach, potatoes];

  it('uses only the chosen items and lists them in the order chosen', () => {
    const [first] = recipesForChosen([omelette], homeFood, ['i2', 'i1'], today, 3);
    expect(first).toMatchObject({ id: 'omelette', uses: ['Blattspinat', 'Eier'], missing: [] });
    // Food that is at home but not chosen does not count as used.
    expect(recipesForChosen([omelette], homeFood, ['i1'], today, 3)[0]?.uses).toEqual(['Eier']);
  });

  it('skips recipes without a chosen item, unknown ids and a limit of zero', () => {
    expect(recipesForChosen([soup], homeFood, ['i1'], today, 3)).toEqual([]);
    expect(recipesForChosen([omelette], homeFood, ['nope'], today, 3)).toEqual([]);
    expect(recipesForChosen([omelette], homeFood, ['i1'], today, 0)).toEqual([]);
  });

  it('counts missing ingredients against all food at home, not only the chosen', () => {
    const [entry] = recipesForChosen([soup], homeFood, ['i3'], today, 3);
    expect(entry?.missing).toEqual(['Karotten']);
    const [covered] = recipesForChosen([omelette], homeFood, ['i1'], today, 3);
    expect(covered?.missing).toEqual([]);
  });

  it('never counts food past its use-by date', () => {
    const old = at('i4', 'Eier', 'dairy-eggs', '2026-11-01', 'use_by');
    expect(recipesForChosen([omelette], [old], ['i4'], today, 3)).toEqual([]);
  });

  it('ranks more chosen items first, then urgency, fewer missing, minutes and id', () => {
    const both = recipe('zeta', 40, [
      { text: 'Eier', categories: ['dairy-eggs'] },
      { text: 'Spinat', words: ['spinat'] },
    ]);
    const urgent = recipe('urgent', 40, [
      { text: 'Spinat', words: ['spinat'] },
      { text: 'Salz', staple: true },
    ]);
    const calm = recipe('calm', 5, [
      { text: 'Eier', categories: ['dairy-eggs'] },
      { text: 'Salz', staple: true },
    ]);
    const order = (list: Recipe[]) =>
      recipesForChosen(list, homeFood, ['i1', 'i2'], today, 5).map((entry) => entry.id);
    expect(order([calm, urgent, both])).toEqual(['zeta', 'urgent', 'calm']);

    const lacking = recipe('a-lacking', 10, [
      { text: 'Eier', categories: ['dairy-eggs'] },
      { text: 'Karotten', categories: ['produce-carrots'] },
    ]);
    const complete = recipe('b-complete', 30, [
      { text: 'Eier', categories: ['dairy-eggs'] },
      { text: 'Salz', staple: true },
    ]);
    const quick = recipe('c-quick', 5, [
      { text: 'Eier', categories: ['dairy-eggs'] },
      { text: 'Salz', staple: true },
    ]);
    const slow = recipe('d-slow', 50, [
      { text: 'Eier', categories: ['dairy-eggs'] },
      { text: 'Salz', staple: true },
    ]);
    const byTie = recipesForChosen([slow, lacking, complete, quick], homeFood, ['i1'], today, 5);
    expect(byTie.map((entry) => entry.id)).toEqual([
      'c-quick',
      'b-complete',
      'd-slow',
      'a-lacking',
    ]);
    expect(recipesForChosen([slow, complete], homeFood, ['i1'], today, 1)).toHaveLength(1);
  });
});
