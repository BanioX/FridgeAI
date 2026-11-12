import { normalizeFoodText } from '../catalog/match';
import type { Nutrition } from '../model/inventory';
import { FRESH_FOODS, type FreshFoodRow } from './fresh-nutrition.data';

export { BLV_DATE, BLV_VERSION } from './fresh-nutrition.data';

/**
 * Categories of unprocessed fresh food: fresh meat and poultry, minced meat, fresh fish and
 * seafood, fruit, vegetables, mushrooms, herbs and eggs. Not cold cuts, sausages, smoked fish,
 * tins, ready meals or frozen food (ADR-0064).
 */
const FRESH_CATEGORIES: ReadonlySet<string> = new Set([
  'meat-poultry',
  'meat-minced',
  'meat-fresh',
  'fish-fresh',
  'dairy-eggs',
  'produce-salad',
  'produce-tomatoes',
  'produce-cucumber',
  'produce-carrots',
  'produce-potatoes',
  'produce-onions',
  'produce-mushrooms',
  'produce-berries',
  'produce-apples',
  'produce-bananas',
  'produce-citrus',
  'produce-herbs',
  'produce-avocado',
  'produce-fruit',
  'produce-vegetables',
]);

/**
 * Words that say the product was processed, so a raw average would be wrong: smoked, breaded,
 * marinated, cooked, a sauce, a ready meal, vegan imitation. Any part of a word («Rauchlachs», «Pouletspiess»).
 */
const PROCESSED_PARTS = [
  'rauch',
  'raeucher',
  'geraeuchert',
  'paniert',
  'mariniert',
  'gewuerz',
  'gebraten',
  'gekocht',
  'gegart',
  'gegrillt',
  'gebacken',
  'gefuellt',
  'gefaerbt',
  'fertig',
  'cordon',
  'curry',
  'konserve',
  'getrocknet',
  'gedoerrt',
  'tiefgekuehlt',
  'essig',
  'eingelegt',
  'sauer',
  'rahm',
  'zuercher',
  'vegan',
  'vegetarisch',
  'veggie',
  'pflanzlich',
  'wachtel',
  'baerlauch',
  'fruehlings',
  'pueree',
  'nuggets',
  'burger',
  'spiess',
  'kebab',
];
/** Words that mark a processed product at the end of a compound («Apfelmus», «Tomatensauce»). */
const PROCESSED_SUFFIXES = ['mus', 'saft', 'chips', 'sauce', 'suppe', 'paste', 'kompott'];
/** Whole words: «in Öl», «Dose», «mit Kräutern» (but «mit Haut» is fine). */
const PROCESSED_WORDS = new Set(['oel', 'dose', 'dosen', 'tk', 'mit', 'an', 'im']);

function isProcessed(words: readonly string[]): boolean {
  return words.some(
    (word, index) =>
      PROCESSED_PARTS.some((part) => word.includes(part)) ||
      PROCESSED_SUFFIXES.some((suffix) => word.endsWith(suffix)) ||
      (PROCESSED_WORDS.has(word) && !(word === 'mit' && words[index + 1] === 'haut')),
  );
}

interface Indexed {
  readonly row: FreshFoodRow;
  readonly keywords: readonly string[];
}

const INDEX: readonly Indexed[] = FRESH_FOODS.map((row) => ({
  row,
  keywords: row.kw.map(normalizeFoodText).filter((keyword) => keyword.length >= 3),
}));

/** Whole word or word ending, phrases as a whole: the rule of `matchCategoryByName`. */
function bestRow(words: readonly string[], normalized: string): FreshFoodRow | undefined {
  let best: { row: FreshFoodRow; length: number } | undefined;
  for (const { row, keywords } of INDEX) {
    for (const keyword of keywords) {
      const hit = keyword.includes(' ')
        ? ` ${normalized} `.includes(` ${keyword} `)
        : words.some((word) => word === keyword || word.endsWith(keyword));
      if (hit && (best === undefined || keyword.length > best.length)) {
        best = { row, length: keyword.length };
      }
    }
  }
  return best?.row;
}

export interface FreshNutritionEstimate {
  /** ID of the food in the BLV database. */
  blvId: number;
  /** Name of the food in the BLV database, e.g. «Thunfisch, roh». */
  food: string;
  nutrition: Nutrition;
}

/**
 * Estimated nutrition values for an unprocessed fresh product without a barcode («Thunfischsteak»,
 * «Äpfel Gala»), from the Swiss Food Composition Database of the BLV. Only for fresh-food
 * categories and only for a sure match: processed names («Rauchlachs», «Pouletbrust Curry») and
 * unknown foods give `undefined`, better nothing than wrong (ADR-0064).
 */
export function freshNutrition(product: {
  name: string;
  categoryId: string;
}): FreshNutritionEstimate | undefined {
  const key = `${product.categoryId}\u0000${product.name}`;
  if (cache.has(key)) {
    return cache.get(key);
  }
  const estimate = estimateFor(product);
  if (cache.size >= CACHE_MAX) {
    cache.clear();
  }
  cache.set(key, estimate);
  return estimate;
}

/** Lists ask for every item on every render; the answer only depends on name and category. */
const CACHE_MAX = 500;
const cache = new Map<string, FreshNutritionEstimate | undefined>();

function estimateFor(product: {
  name: string;
  categoryId: string;
}): FreshNutritionEstimate | undefined {
  if (!FRESH_CATEGORIES.has(product.categoryId)) {
    return undefined;
  }
  const normalized = normalizeFoodText(product.name);
  if (normalized === '') {
    return undefined;
  }
  const words = normalized.split(' ');
  if (isProcessed(words)) {
    return undefined;
  }
  // «Pouletbrüstli, Natur»: the product comes before the comma.
  const head = normalizeFoodText(product.name.split(',')[0] ?? '');
  const row =
    (head === normalized ? undefined : bestRow(head.split(' '), head)) ??
    bestRow(words, normalized) ??
    FRESH_FOODS.find((candidate) => candidate.cat?.includes(product.categoryId) === true);
  if (row === undefined) {
    return undefined;
  }
  return {
    blvId: row.id,
    food: row.food,
    nutrition: { basis: '100g', ...row.n, source: 'blv' },
  };
}
