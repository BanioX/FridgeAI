import { normalizeFoodText } from '../catalog/match';
import type { ProductSearchHit } from '../ports';

/**
 * Matching receipt lines with Open Food Facts (Alban, 7.11.2026: one tap per receipt). A receipt
 * names a product the way the till prints it («Naturaplan Bio Coconutwater 1L»); the open
 * database knows it with barcode, brand and pack size. Only the cleaned words of the name are
 * searched: no price, no shop, no date, no quantity.
 */

export type MatchConfidence = 'sure' | 'maybe';

export interface ReceiptSearchPlan {
  /** Product words as printed, without pack sizes. */
  query: string;
  /** Without house brands and «Bio», for a second try when the first finds nothing. */
  fallback?: string;
}

interface PackSize {
  amount: number;
  unit: 'g' | 'ml';
}

/**
 * House brands of Swiss shops, normalised: they help to rank, but block a search when the open
 * database lists the product without them.
 */
const HOUSE_BRANDS = new Set([
  'coop',
  'naturaplan',
  'prix',
  'garantie',
  'qualite',
  'betty',
  'bossi',
  'karma',
  'm',
  'budget',
  'classic',
  'migros',
  'aproz',
  'selection',
  'lidl',
  'milbona',
  'aldi',
  'denner',
  'volg',
  'bio',
]);

const isHouseBrand = (word: string) =>
  normalizeFoodText(word)
    .split(' ')
    .every((token) => HOUSE_BRANDS.has(token));

const SIZE_TOKEN =
  /^(?:\d+(?:[.,]\d+)?)(?:x\d+(?:[.,]\d+)?)?(?:g|gr|kg|l|cl|dl|ml|st|stk|stück|x)?\.?$/i;
const NOISE = new Set(['ca', 'ca.', 'aktion', 'je', 'à', 'a', '%']);

function words(name: string): string[] {
  return name
    .replace(/[|*#+]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word !== '' && !SIZE_TOKEN.test(word) && !NOISE.has(word.toLowerCase()));
}

function tokens(text: string): string[] {
  return normalizeFoodText(text)
    .split(' ')
    .filter((token) => token.length > 1 && !SIZE_TOKEN.test(token));
}

/** What to search for a receipt line, or `null` when nothing searchable is left. */
export function receiptSearchPlan(name: string): ReceiptSearchPlan | null {
  const kept = words(name);
  const query = kept.slice(0, 6).join(' ');
  if (normalizeFoodText(query).replace(/\s/g, '').length < 3) {
    return null;
  }
  const plain = kept.filter((word) => !isHouseBrand(word));
  const fallback = plain.slice(0, 5).join(' ');
  return fallback !== query && normalizeFoodText(fallback).replace(/\s/g, '').length >= 3
    ? { query, fallback }
    : { query };
}

/** «180g», «1L», «75cl», «1,5 l», «500 ml» → grams or millilitres. */
export function parsePackSize(text: string): PackSize | null {
  const found = /(\d+(?:[.,]\d+)?)\s*(kg|g|l|cl|dl|ml)\b/i.exec(text);
  if (found === null) {
    return null;
  }
  const value = Number((found[1] ?? '').replace(',', '.'));
  const unit = (found[2] ?? '').toLowerCase();
  const factor: Record<string, [number, PackSize['unit']]> = {
    g: [1, 'g'],
    kg: [1000, 'g'],
    ml: [1, 'ml'],
    cl: [10, 'ml'],
    dl: [100, 'ml'],
    l: [1000, 'ml'],
  };
  const [multiplier, base] = factor[unit] ?? [0, 'g'];
  return Number.isFinite(value) && value > 0 && multiplier > 0
    ? { amount: Math.round(value * multiplier), unit: base }
    : null;
}

/** Both sizes known and different: another pack, so another barcode. */
function otherPack(name: string, hit: ProductSearchHit): boolean {
  const printed = parsePackSize(name);
  const packed = hit.packSize === undefined ? null : parsePackSize(hit.packSize);
  return (
    printed !== null &&
    packed !== null &&
    (printed.unit !== packed.unit || printed.amount !== packed.amount)
  );
}

function score(name: string, hit: ProductSearchHit): number {
  const wanted = new Set(tokens(name));
  const offered = new Set(tokens(`${hit.name} ${hit.brand ?? ''}`));
  if (wanted.size === 0 || offered.size === 0) {
    return 0;
  }
  const shared = [...wanted].filter((token) => offered.has(token)).length;
  // Dice: the shared words, measured against both sides.
  let result = (2 * shared) / (wanted.size + offered.size);
  const productWords = [...wanted].filter((token) => !HOUSE_BRANDS.has(token));
  if (productWords.length > 0 && productWords.every((token) => offered.has(token))) {
    result += 0.2;
  }
  const printed = parsePackSize(name);
  const packed = hit.packSize === undefined ? null : parsePackSize(hit.packSize);
  if (printed !== null && packed !== null) {
    result += otherPack(name, hit) ? -0.15 : 0.2;
  }
  return result;
}

/**
 * The best hit for a receipt line. «sure»: the product words all appear and nothing else comes
 * close; «maybe»: worth showing as a suggestion. Either way the person confirms it.
 */
export function rankReceiptHits(
  name: string,
  hits: readonly ProductSearchHit[],
): { hit: ProductSearchHit; confidence: MatchConfidence } | null {
  const ranked = hits
    .map((hit) => ({ hit, score: score(name, hit) }))
    .sort((a, b) => b.score - a.score);
  const [best, second] = ranked;
  if (best === undefined || best.score < 0.45) {
    return null;
  }
  const clear = second === undefined || best.score - second.score >= 0.1;
  const sure = best.score >= 0.75 && clear && !otherPack(name, best.hit);
  return { hit: best.hit, confidence: sure ? 'sure' : 'maybe' };
}
