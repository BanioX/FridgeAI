import { describe, expect, it } from 'vitest';
import { parseShoppingText } from '../src';

describe('parseShoppingText', () => {
  it('reads the example sentence', () => {
    expect(
      parseShoppingText('Milch, 2 Joghurt, ein Brot und 500 g Hackfleisch sowie Eier'),
    ).toEqual([
      { name: 'Milch' },
      { name: 'Joghurt', quantity: 2, unit: 'pcs' },
      { name: 'Brot', quantity: 1, unit: 'pcs' },
      { name: 'Hackfleisch', quantity: 500, unit: 'g' },
      { name: 'Eier' },
    ]);
  });

  it('returns nothing for empty or blank input', () => {
    expect(parseShoppingText('')).toEqual([]);
    expect(parseShoppingText('  \n , ; ')).toEqual([]);
  });

  it('splits on semicolons, line breaks, plus and ampersand', () => {
    expect(parseShoppingText('Rüebli;Rahm\nWeggli plus Butter & Käse').map((l) => l.name)).toEqual([
      'Rüebli',
      'Rahm',
      'Weggli',
      'Butter',
      'Käse',
    ]);
  });

  it('keeps Swiss words and capitalises only the first letter', () => {
    expect(parseShoppingText('rüebli, zürcher Geschnetzeltes, 6 Weggli')).toEqual([
      { name: 'Rüebli' },
      { name: 'Zürcher Geschnetzeltes' },
      { name: 'Weggli', quantity: 6, unit: 'pcs' },
    ]);
  });

  it('reads decimal numbers with comma and point', () => {
    expect(parseShoppingText('1,5 kg Äpfel, 1.5 l Milch')).toEqual([
      { name: 'Äpfel', quantity: 1.5, unit: 'kg' },
      { name: 'Milch', quantity: 1.5, unit: 'l' },
    ]);
  });

  it('reads number words from eins to zwölf', () => {
    expect(parseShoppingText('zwei Äpfel, drei Gurken, zwölf Eier, eine Zitrone')).toEqual([
      { name: 'Äpfel', quantity: 2, unit: 'pcs' },
      { name: 'Gurken', quantity: 3, unit: 'pcs' },
      { name: 'Eier', quantity: 12, unit: 'pcs' },
      { name: 'Zitrone', quantity: 1, unit: 'pcs' },
    ]);
  });

  it('reads «ein paar» as no quantity', () => {
    expect(parseShoppingText('ein paar Tomaten')).toEqual([{ name: 'Tomaten' }]);
  });

  it('reads «halbes» and «halbe» as 0.5', () => {
    expect(parseShoppingText('ein halbes Brot, halbe Gurke, ein halbes Kilo Hackfleisch')).toEqual([
      { name: 'Brot', quantity: 0.5, unit: 'pcs' },
      { name: 'Gurke', quantity: 0.5, unit: 'pcs' },
      { name: 'Hackfleisch', quantity: 0.5, unit: 'kg' },
    ]);
  });

  it('understands the units', () => {
    expect(
      parseShoppingText(
        '250 gr Mehl, 2 Kilo Kartoffeln, 3dl Rahm, 2 Liter Wasser, 50 cl Sirup, 200ml Essig, 3 Stück Tofu, 2 Stk Lauch, 2x Eier, 2 Packungen Spaghetti, 1 Pack Butter',
      ),
    ).toEqual([
      { name: 'Mehl', quantity: 250, unit: 'g' },
      { name: 'Kartoffeln', quantity: 2, unit: 'kg' },
      { name: 'Rahm', quantity: 3, unit: 'dl' },
      { name: 'Wasser', quantity: 2, unit: 'l' },
      { name: 'Sirup', quantity: 50, unit: 'cl' },
      { name: 'Essig', quantity: 200, unit: 'ml' },
      { name: 'Tofu', quantity: 3, unit: 'pcs' },
      { name: 'Lauch', quantity: 2, unit: 'pcs' },
      { name: 'Eier', quantity: 2, unit: 'pcs' },
      { name: 'Spaghetti', quantity: 2, unit: 'pcs' },
      { name: 'Butter', quantity: 1, unit: 'pcs' },
    ]);
  });

  it('does not take the start of a name for a unit', () => {
    expect(parseShoppingText('2 Lachs, 3 Gurken')).toEqual([
      { name: 'Lachs', quantity: 2, unit: 'pcs' },
      { name: 'Gurken', quantity: 3, unit: 'pcs' },
    ]);
  });

  it('drops filler words and the final period', () => {
    expect(parseShoppingText('Ich brauche noch Milch und bitte Eier.')).toEqual([
      { name: 'Milch' },
      { name: 'Eier' },
    ]);
    expect(parseShoppingText('Wir brauchen 2 Joghurt')).toEqual([
      { name: 'Joghurt', quantity: 2, unit: 'pcs' },
    ]);
    expect(parseShoppingText('einkaufen: Brot, Butter')).toEqual([
      { name: 'Brot' },
      { name: 'Butter' },
    ]);
    expect(parseShoppingText('kaufen Käse')).toEqual([{ name: 'Käse' }]);
  });

  it('does not strip filler words that only start a product name', () => {
    expect(parseShoppingText('Nockerl, Bitterorangen')).toEqual([
      { name: 'Nockerl' },
      { name: 'Bitterorangen' },
    ]);
  });

  it('removes duplicates case-insensitively', () => {
    expect(parseShoppingText('Milch, milch, MILCH')).toEqual([{ name: 'Milch' }]);
  });

  it('adds quantities of duplicates only when the units match', () => {
    expect(parseShoppingText('2 Joghurt, 3 Joghurt')).toEqual([
      { name: 'Joghurt', quantity: 5, unit: 'pcs' },
    ]);
    expect(parseShoppingText('1 l Milch, 2 dl Milch')).toEqual([
      { name: 'Milch', quantity: 1, unit: 'l' },
    ]);
  });

  it('takes a later quantity if the first mention had none', () => {
    expect(parseShoppingText('Brot, 2 Brot')).toEqual([{ name: 'Brot', quantity: 2, unit: 'pcs' }]);
  });

  it('drops parts that are only a quantity', () => {
    expect(parseShoppingText('Milch, 2 kg, ein')).toEqual([{ name: 'Milch' }]);
  });

  it('ignores a zero quantity', () => {
    expect(parseShoppingText('0 Milch')).toEqual([{ name: 'Milch' }]);
  });
  it('splits dictated runs without commas when every word is a known food', () => {
    expect(parseShoppingText('Milch Eier Brot und Butter').map((l) => l.name)).toEqual([
      'Milch',
      'Eier',
      'Brot',
      'Butter',
    ]);
    expect(parseShoppingText('ich brauche Milch Eier Brot').map((l) => l.name)).toEqual([
      'Milch',
      'Eier',
      'Brot',
    ]);
  });

  it('starts a new product at a number after a word', () => {
    expect(parseShoppingText('Milch 2 Joghurt Brot')).toEqual([
      { name: 'Milch' },
      { name: 'Joghurt', quantity: 2, unit: 'pcs' },
      { name: 'Brot' },
    ]);
  });

  it('keeps word pairs that are not all foods on their own', () => {
    expect(parseShoppingText('Zürcher Geschnetzeltes und Grüne Bohnen').map((l) => l.name)).toEqual(
      ['Zürcher Geschnetzeltes', 'Grüne Bohnen'],
    );
  });

  it('moves an amount spoken after the product to it', () => {
    expect(parseShoppingText('Rahm 2 Deziliter, Hackfleisch 500 g')).toEqual([
      { name: 'Rahm', quantity: 2, unit: 'dl' },
      { name: 'Hackfleisch', quantity: 500, unit: 'g' },
    ]);
  });

  it('reads spelled-out units and keeps names within 80 characters', () => {
    expect(parseShoppingText('zwei Deziliter Rahm')).toEqual([
      { name: 'Rahm', quantity: 2, unit: 'dl' },
    ]);
    const [line] = parseShoppingText('x'.repeat(120));
    expect(line?.name.length).toBe(80);
  });
});
