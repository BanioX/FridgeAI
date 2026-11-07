import { describe, expect, it } from 'vitest';
import { NutritionSchema, parseNutritionLabel } from '../src';

const MIGROS_DE = `
Nährwerte pro 100 g       pro Portion (30 g)
Energie        1046 kJ / 250 kcal      314 kJ / 75 kcal
Fett           8,5 g                   2,6 g
  davon gesättigte Fettsäuren   3,2 g  1,0 g
Kohlenhydrate  32 g                    9,6 g
  davon Zucker 12,5 g                  3,8 g
Nahrungsfasern 2,1 g                   0,6 g
Eiweiss        6,4 g                   1,9 g
Salz           <0,5 g                  0,1 g
`;

const COOP_FR = `
Valeurs nutritionnelles moyennes pour 100 g
Énergie 1046 kJ (250 kcal)
Matières grasses 8,5 g
dont acides gras saturés 3,2 g
Glucides 32 g
dont sucres 12,5 g
Fibres alimentaires 2,1 g
Protéines 6,4 g
Sel 0,45 g
`;

const COOP_IT = `
Valori nutrizionali medi per 100 g
Energia 250 kcal / 1046 kJ
Grassi 8,5 g
di cui acidi grassi saturi 3,2 g
Carboidrati 32 g
di cui zuccheri 12,5 g
Fibre 2,1 g
Proteine 6,4 g
Sale 0,45 g
`;

const MIGIPEDIA = `
Nährwerte
Pro 100 g
Energie 1046 kJ (250 kcal)
Fett 8.5 g
davon gesättigte Fettsäuren 3.2 g
Kohlenhydrate 32 g
davon Zucker 12.5 g
Ballaststoffe 2.1 g
Eiweiß 6.4 g
Salz 0.45 g
`;

const EN = `
Nutrition facts per 100 ml
Energy 180 kJ (43 kcal)
Fat 1.5 g
of which saturates 0.9 g
Carbohydrate 5 g
Protein 3.4 g
Salt 0.1 g
`;

describe('parseNutritionLabel', () => {
  it('reads a Migros-style German table: first column, kcal preferred', () => {
    expect(parseNutritionLabel(MIGROS_DE)).toEqual({
      basis: '100g',
      energyKcal: 250,
      fat: 8.5,
      saturatedFat: 3.2,
      carbohydrates: 32,
      sugars: 12.5,
      fiber: 2.1,
      protein: 6.4,
      salt: 0.5,
      source: 'manual',
    });
  });

  it('reads a French Coop-style table', () => {
    expect(parseNutritionLabel(COOP_FR)).toEqual({
      basis: '100g',
      energyKcal: 250,
      fat: 8.5,
      saturatedFat: 3.2,
      carbohydrates: 32,
      sugars: 12.5,
      fiber: 2.1,
      protein: 6.4,
      salt: 0.45,
      source: 'manual',
    });
  });

  it('reads an Italian table', () => {
    const result = parseNutritionLabel(COOP_IT);
    expect(result).toMatchObject({
      energyKcal: 250,
      fat: 8.5,
      saturatedFat: 3.2,
      carbohydrates: 32,
      sugars: 12.5,
      fiber: 2.1,
      protein: 6.4,
    });
    expect(result?.salt).toBe(0.45);
  });

  it('reads Migipedia screenshot text with point decimals, «ß» and «Pro 100 g»', () => {
    const result = parseNutritionLabel(MIGIPEDIA);
    expect(result).toMatchObject({
      basis: '100g',
      energyKcal: 250,
      fat: 8.5,
      saturatedFat: 3.2,
      sugars: 12.5,
      fiber: 2.1,
      protein: 6.4,
    });
  });

  it('reads English labels and a 100 ml basis', () => {
    expect(parseNutritionLabel(EN)).toEqual({
      basis: '100ml',
      energyKcal: 43,
      fat: 1.5,
      saturatedFat: 0.9,
      carbohydrates: 5,
      protein: 3.4,
      salt: 0.1,
      source: 'manual',
    });
  });

  it('computes kcal from kJ when only kJ is printed', () => {
    const result = parseNutritionLabel('Energie 1046 kJ\nFett 8 g\nEiweiss 6 g');
    expect(result?.energyKcal).toBe(250);
  });

  it('takes the kcal number whichever order the units come in', () => {
    expect(parseNutritionLabel('Energie 250 kcal 1046 kJ\nFett 8 g\nSalz 1 g')?.energyKcal).toBe(
      250,
    );
    expect(parseNutritionLabel('Energie 1046 kJ 250 kcal\nFett 8 g\nSalz 1 g')?.energyKcal).toBe(
      250,
    );
  });

  it('takes «<0,5 g» as 0.5', () => {
    const result = parseNutritionLabel('Fett <0,5 g\nEiweiss < 0.1 g\nSalz 0,01 g');
    expect(result).toMatchObject({ fat: 0.5, protein: 0.1, salt: 0.01 });
  });

  it('survives OCR noise: «O» for zero, stray bars, glued units', () => {
    const noisy = `
| Nährwerte pro 100 g |
| Energie | 1O46 kJ (25O kcal) |
| Fett | 8,5 g |
| davon gesättigte Fettsäuren | 3,2 g |
| Kohlenhydrate | 32 g |
| davon Zucker | O,5 g |
| Eiweiss | 6,4g |
| Salz | O,45 g |
`;
    expect(parseNutritionLabel(noisy)).toMatchObject({
      energyKcal: 250,
      fat: 8.5,
      saturatedFat: 3.2,
      carbohydrates: 32,
      sugars: 0.5,
      protein: 6.4,
      salt: 0.45,
    });
    expect(parseNutritionLabel('Fett O g\nZucker O g\nSalz 0,O g')).toMatchObject({
      fat: 0,
      sugars: 0,
      salt: 0,
    });
  });

  it('follows a value that OCR put on the next line', () => {
    const broken =
      'Energie\n1046 kJ (250 kcal)\nFett\n8,5 g\ndavon gesättigte Fettsäuren\n3,2 g\nSalz 0,5 g';
    expect(parseNutritionLabel(broken)).toMatchObject({
      energyKcal: 250,
      fat: 8.5,
      saturatedFat: 3.2,
      salt: 0.5,
    });
  });

  it('does not take the next label’s value for a label without one', () => {
    const result = parseNutritionLabel('Fett\nEiweiss 6 g\nSalz 1 g\nKohlenhydrate 5 g');
    expect(result?.fat).toBeUndefined();
    expect(result?.protein).toBe(6);
  });

  it('keeps several labels on one line apart', () => {
    expect(
      parseNutritionLabel('Fett 8 g davon gesättigte Fettsäuren 3 g Eiweiss 6 g'),
    ).toMatchObject({ fat: 8, saturatedFat: 3, protein: 6 });
  });

  it('handles Swiss thousands marks and milligrams', () => {
    const result = parseNutritionLabel("Energie 1'046 kJ\nFett 8 g\nSalz 500 mg");
    expect(result).toMatchObject({ energyKcal: 250, salt: 0.5 });
  });

  it('clamps to the schema limits and always validates', () => {
    const result = parseNutritionLabel('Energie 4000 kcal\nFett 250 g\nEiweiss 6 g');
    expect(result).toMatchObject({ energyKcal: 900, fat: 100, protein: 6 });
    for (const text of [MIGROS_DE, COOP_FR, COOP_IT, MIGIPEDIA, EN]) {
      const parsed = parseNutritionLabel(text);
      expect(parsed).not.toBeNull();
      expect(() => NutritionSchema.parse(parsed)).not.toThrow();
    }
  });

  it('ignores percentages and ingredient lists', () => {
    const text = 'Zutaten: Zucker 20%, Salz, Weizenmehl\nFett 8 g\nEiweiss 6 g\nSalz 1 g';
    expect(parseNutritionLabel(text)).toMatchObject({ fat: 8, protein: 6, salt: 1 });
    expect(parseNutritionLabel(text)?.sugars).toBeUndefined();
  });

  it('returns null for fewer than three nutrients and for unrelated text', () => {
    expect(parseNutritionLabel('Fett 8 g\nSalz 1 g')).toBeNull();
    expect(parseNutritionLabel('')).toBeNull();
    expect(parseNutritionLabel('Coop Semmeli 80G 2.0 0.70 1.40\nTotal CHF 15.55')).toBeNull();
  });
});
