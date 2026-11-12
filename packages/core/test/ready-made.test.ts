import { describe, expect, it } from 'vitest';
import { categoryById, matchCategoryByName } from '../src/catalog/match';
import { CATEGORIES } from '../src/catalog/categories';
import { isReadyMade, type ReadySource } from '../src/ready-made';

describe('Zutat oder Fertigprodukt: matcher', () => {
  it.each([
    ['Skyr Cheesecake', 'prepared-desserts'],
    ['Cheesecake', 'prepared-desserts'],
    ['Tiramisu', 'prepared-desserts'],
    ['Schokoladenpudding', 'prepared-desserts'],
    ['Vanillepudding', 'prepared-desserts'],
    ['Mousse au Chocolat', 'prepared-desserts'],
    ['Panna Cotta', 'prepared-desserts'],
    ['Crème brûlée', 'prepared-desserts'],
    ['Rüeblitorte', 'prepared-desserts'],
    ['Dessert Vanille', 'prepared-desserts'],
    ['Caramel Köpfli', 'prepared-desserts'],
    ['Flan Caramel', 'prepared-desserts'],
    ['Sandwich Schinken', 'prepared-ready-meals'],
    ['Lasagne', 'prepared-ready-meals'],
    ['Sushi Box', 'prepared-ready-meals'],
    ['Pastasalat', 'prepared-ready-meals'],
    ['Oreo', 'pantry-sweets'],
    ['Oreo Kekse', 'pantry-sweets'],
    ['Butterkekse', 'pantry-sweets'],
    ['Kartoffelchips', 'pantry-sweets'],
    ['Vanilleglace', 'frozen-icecream'],
    ['Tiefkühlpizza Margherita', 'frozen-meals'],
    ['TK Lasagne', 'frozen-meals'],
    ['Emmi Skyr Nature', 'dairy-yoghurt'],
    ['Skyr', 'dairy-yoghurt'],
    ['Naturjoghurt', 'dairy-yoghurt'],
    ['Schinken', 'meat-coldcuts'],
    ['Rohschinken', 'meat-coldcuts'],
    ['Vollmilch', 'dairy-milk'],
    ['Butter', 'dairy-butter'],
  ])('maps %s to %s', (name, expected) => {
    expect(matchCategoryByName(name)?.id).toBe(expected);
  });

  it('marks exactly the ready categories', () => {
    const ready = CATEGORIES.filter((category) => category.ready === true)
      .map((category) => category.id)
      .sort();
    expect(ready).toEqual([
      'frozen-icecream',
      'frozen-meals',
      'pantry-sweets',
      'prepared-desserts',
      'prepared-ready-meals',
    ]);
  });

  it('gives Desserts a shelf life like yoghurt and dips', () => {
    const desserts = categoryById('prepared-desserts');
    expect(desserts?.defaultLocation).toBe('fridge');
    expect(desserts?.shelfLifeDays).toMatchObject({ fridge: 7, freezer: 60 });
    expect(desserts?.dateKind).toBe('best_before');
  });
});

describe('isReadyMade', () => {
  const yoghurt = (readyMade?: boolean): ReadySource => ({
    categoryId: 'dairy-yoghurt',
    ...(readyMade === undefined ? {} : { readyMade }),
  });

  it('follows the category when the item says nothing', () => {
    expect(isReadyMade({ categoryId: 'prepared-desserts' })).toBe(true);
    expect(isReadyMade(yoghurt())).toBe(false);
    expect(isReadyMade({ categoryId: 'unknown-category' })).toBe(false);
  });

  it('lets the item override the category in both directions', () => {
    expect(isReadyMade(yoghurt(true))).toBe(true);
    expect(isReadyMade({ categoryId: 'prepared-desserts', readyMade: false })).toBe(false);
  });
});
