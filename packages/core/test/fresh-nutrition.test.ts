import { describe, expect, it } from 'vitest';
import { matchCategoryByName } from '../src/catalog/match';
import { NutritionSchema } from '../src/model/inventory';
import { freshNutrition } from '../src/nutrition/fresh-nutrition';

/** The food the estimate stands for, with the category the app would give the name. */
function foodOf(name: string, categoryId = matchCategoryByName(name)?.id ?? 'pantry-other') {
  return freshNutrition({ name, categoryId })?.food;
}

describe('freshNutrition', () => {
  it.each([
    ['Thunfischsteak', 'Thunfisch, roh'],
    ['Rindshackfleisch', 'Rind, Gehacktes, roh'],
    ['Hackfleisch', 'Gehacktes (Durchschnitt aus Rind, Kalb, Schwein, Poulet), roh'],
    ['Pouletbrust', 'Poulet, Brust, ohne Haut, roh'],
    ['Pouletbrüstli', 'Poulet, Brust, ohne Haut, roh'],
    ['Äpfel Gala', 'Apfel, roh'],
    ['Lachsfilet', 'Lachs, Zucht, roh'],
    ['Wildlachs', 'Lachs, Wildfang, roh'],
    ['Seelachsfilet', 'Seelachs, roh'],
    ['Rüebli', 'Karotte, roh'],
    ['Peperoni', 'Peperoni, rot, roh'],
    ['Freilandeier', 'Hühnerei, ganz, roh'],
    ['Cherrytomaten', 'Tomate, roh'],
    ['Knoblauch', 'Knoblauch, roh'],
    ['Pouletbrüstli, Natur', 'Poulet, Brust, ohne Haut, roh'],
    ['Pouletbrust mit Haut', 'Poulet, Brust, mit Haut, roh'],
    ['Zucchini', 'Zucchetti, roh'],
  ])('%s is %s', (name, food) => {
    expect(foodOf(name)).toBe(food);
  });

  it('knows seafood the category guess does not (the person can set the category)', () => {
    expect(foodOf('Crevetten', 'fish-fresh')).toBe(
      'Garnele, geschält, roh (frisch oder tiefgekuhlt)',
    );
  });

  it('falls back to the one food of a category', () => {
    expect(foodOf('Gala 1 kg', 'produce-apples')).toBe('Apfel, roh');
    expect(foodOf('Bio', 'dairy-eggs')).toBe('Hühnerei, ganz, roh');
    expect(foodOf('Tomaten', 'produce-vegetables')).toBe('Tomate, roh');
  });

  it('says whole numbers of the BLV values, per 100 g, marked as estimated', () => {
    const estimate = freshNutrition({ name: 'Thunfischsteak', categoryId: 'fish-fresh' });
    expect(estimate).toMatchObject({
      blvId: 756,
      nutrition: { basis: '100g', source: 'blv', protein: 25.8 },
    });
    expect(NutritionSchema.safeParse(estimate?.nutrition).success).toBe(true);
  });

  it.each([
    ['Rauchlachs', 'fish-smoked-salmon'],
    ['Rauchlachs', 'fish-fresh'],
    ['Thunfisch in Öl', 'pantry-canned'],
    ['Thunfisch in Öl', 'fish-fresh'],
    ['Fleischkäse', 'meat-coldcuts'],
    ['Fleischkäse', 'meat-fresh'],
    ['Pouletbrust Curry-Geschnetzeltes Fertiggericht', 'prepared-ready-meals'],
    ['Pouletbrust Curry-Geschnetzeltes Fertiggericht', 'meat-poultry'],
    ['Pouletbrust paniert', 'meat-poultry'],
    ['Poulet Nuggets', 'meat-poultry'],
    ['Rahmgeschnetzeltes', 'meat-fresh'],
    ['Pouletbrust mit Kräutern', 'meat-poultry'],
    ['Hackfleisch vegan', 'meat-minced'],
    ['Apfelmus', 'produce-apples'],
    ['Essiggurken', 'produce-cucumber'],
    ['Bärlauch', 'produce-herbs'],
    ['Wachteleier', 'dairy-eggs'],
    ['Thunfischsteak', 'frozen-meals'],
    ['Pouletbrust', 'prepared-ready-meals'],
    ['Pouletbrust', 'meat-coldcuts'],
    ['Äpfel', 'pantry-canned'],
    ['Kartoffelsalat', 'produce-potatoes'],
    ['Unbekannter Fisch', 'fish-fresh'],
    ['', 'meat-fresh'],
  ])('gives nothing for %s in %s', (name, categoryId) => {
    expect(freshNutrition({ name, categoryId })).toBeUndefined();
  });

  it('gives the same answer twice', () => {
    const first = freshNutrition({ name: 'Lachsfilet', categoryId: 'fish-fresh' });
    expect(freshNutrition({ name: 'Lachsfilet', categoryId: 'fish-fresh' })).toBe(first);
  });
});
