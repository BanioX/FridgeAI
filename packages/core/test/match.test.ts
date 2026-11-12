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
    ['Schmelzkäse Scheiben', 'dairy-cheese-slices'],
    ['Toastkäse', 'dairy-cheese-slices'],
    ['Scheibletten Classic', 'dairy-cheese-slices'],
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

describe('precision on real receipt lines (Lidl, 8.11.2026)', () => {
  const id = (name: string) => matchCategoryByName(name)?.id;

  it('knows fruit, vegetables and the words a receipt cuts off', () => {
    expect(id('Kirschen lose')).toBe('produce-fruit');
    expect(id('Plattnektarinen')).toBe('produce-fruit');
    expect(id('Trauben hell kernlos')).toBe('produce-fruit');
    expect(id('Pimientos de Padron 200g')).toBe('produce-vegetables');
    expect(id('Landjäger')).toBe('meat-coldcuts');
    expect(id('Schweizer Schmelzkäses.')).toBe('dairy-cheese-slices');
    expect(id('Zott Monte 2K-Joghu.Butt')).toBe('dairy-yoghurt');
    expect(id('Push up Lollies mit Gumm')).toBe('frozen-icecream');
  });

  it('lets flavour and origin words lose against the product', () => {
    expect(id('Eislutscher Cola')).toBe('frozen-icecream');
    expect(id('Glace Schokolade')).toBe('frozen-icecream');
    expect(id('Eistee Pfirsich')).not.toBe('produce-fruit');
    expect(id('Appenzeller Bratspeck')).toBe('meat-coldcuts');
    expect(id('Appenzeller')).toBe('dairy-cheese-hard');
    expect(id('Pfirsiche')).toBe('produce-fruit');
    expect(id('Feiner Rührkuchen, Zitrone')).toBe('bakery-pastry');
    expect(id('Fleischkäse, geschnitten')).toBe('meat-coldcuts');
  });

  it('moves «TK» food to the freezer', () => {
    expect(id('TK Hähnchen-Cordon Bleu')).toBe('frozen-meals');
    expect(id('TK Broccoli')).toBe('frozen-vegetables');
    expect(id('TK Bauernhof Nuggets')).toBe('frozen-meals');
  });

  it('does not guess from short cut-offs', () => {
    expect(id('Rosé Millesimato extra dry')).not.toBe('produce-vegetables');
    expect(id('Port Tawny')).toBeUndefined();
  });
});
