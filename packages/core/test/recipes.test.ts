import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/catalog/categories';
import { localDate } from '../src/dates';
import type { DateKind } from '../src/model/primitives';
import {
  ingredientsAtHome,
  RecipeSchema,
  suggestRecipes,
  type FoodAtHome,
  type Recipe,
} from '../src/recipes/recipe';
import { RECIPES } from '../src/recipes/recipes.de-CH';

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

describe('ingredientsAtHome', () => {
  it('names the food that counts, skips staples and food past use-by', () => {
    const atHome = [
      food('Eier', 'dairy-eggs', '2026-11-10'),
      food('Spinat', 'produce-salad', '2026-11-03', 'use_by'),
    ];
    expect(ingredientsAtHome(omelette, atHome, today)).toEqual([
      { text: 'Eier', staple: false, optional: false, atHome: ['Eier'] },
      { text: 'Spinat', staple: false, optional: false, atHome: [] },
      { text: 'Käse', staple: false, optional: true, atHome: [] },
      { text: 'Salz', staple: true, optional: false, atHome: [] },
    ]);
  });
});
