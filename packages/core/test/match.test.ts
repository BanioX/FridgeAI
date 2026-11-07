import { describe, expect, it } from 'vitest';
import {
  categoryById,
  fallbackCategory,
  FALLBACK_CATEGORY_ID,
  matchCategoryByName,
  normalizeFoodText,
} from '../src/catalog/match';
import { CATEGORIES } from '../src/catalog/categories';
import { RECEIPT_WORDS } from '../src/catalog/receipt-words';

describe('normalizeFoodText', () => {
  it('folds case, umlauts, accents and punctuation', () => {
    expect(normalizeFoodText('M-Budget Rüebli 1kg')).toBe('m budget rueebli 1kg'); // ü + e
    expect(normalizeFoodText('Crème fraîche')).toBe('creme fraiche');
    expect(normalizeFoodText('  ')).toBe('');
  });
});

describe('matchCategoryByName', () => {
  it.each([
    ['Vollmilch', 'dairy-milk'],
    ['M-Budget Vollmilch 1l', 'dairy-milk'],
    ['Halbrahm', 'dairy-cream'],
    ['Bratwurst', 'meat-sausage'],
    ['Basmatireis', 'pantry-rice'],
    ['Milchreis', 'pantry-rice'],
    ['Preiselbeeren', 'produce-berries'],
    ['Rüebli', 'produce-carrots'],
    ['Ruebli', 'produce-carrots'],
    ['Schoggi', 'pantry-sweets'],
    ['Buttergipfeli', 'bakery-pastry'],
    ['Saurer Rahm', 'dairy-cream'],
    ['Grana Padano', 'dairy-cheese-hard'],
    ['Bergkäse', 'dairy-cheese-hard'],
    ['Pouletbrust', 'meat-poultry'],
    ['Gefriergetrocknet Risotto', 'reserve-freeze-dried'],
  ])('maps %s to %s', (name, expected) => {
    expect(matchCategoryByName(name)?.id).toBe(expected);
  });

  it('returns null when nothing matches', () => {
    expect(matchCategoryByName('Xylophon')).toBeNull();
    expect(matchCategoryByName('')).toBeNull();
  });
});

describe('catalog lookup', () => {
  it('finds categories by id and has a fallback', () => {
    expect(categoryById('dairy-milk')?.name.de).toBe('Milch');
    expect(categoryById('nope')).toBeUndefined();
    expect(fallbackCategory().id).toBe(FALLBACK_CATEGORY_ID);
  });
});

describe('receipt words (plan 4d)', () => {
  it('knows Swiss receipt words and keeps pet food out of the fish', () => {
    const id = (name: string) => matchCategoryByName(name)?.id;
    expect(id('Skyr Natur')).toBe('dairy-yoghurt');
    expect(id('Semmeli 80G')).toBe('bakery-bread');
    expect(id('Prix Garantie Trockenfl. Imp.')).toBe('meat-coldcuts');
    expect(id('Frigemo Flüssig Eiweiss')).toBe('dairy-eggs');
    expect(id('Eierspätzli')).toBe('prepared-ready-meals');
    expect(id('Dreamies mit Lachs')).toBe('nonfood-pet-food');
    expect(id('Katzen Schleck-Snack')).toBe('nonfood-pet-food');
  });

  it('only maps to categories that exist and never repeats a catalog keyword', () => {
    const keywords = new Set(CATEGORIES.flatMap((category) => category.keywords));
    for (const [word, categoryId] of Object.entries(RECEIPT_WORDS)) {
      expect(categoryById(categoryId), word).toBeDefined();
      expect(keywords.has(word), word).toBe(false);
    }
  });
});
