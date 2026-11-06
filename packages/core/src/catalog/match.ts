import { CATEGORIES } from './categories';
import type { Category } from './category';

/** Category used when nothing matches; people can change it later. */
export const FALLBACK_CATEGORY_ID = 'pantry-other';

const byId = new Map(CATEGORIES.map((category) => [category.id, category]));

export function categoryById(id: string): Category | undefined {
  return byId.get(id);
}

export function fallbackCategory(): Category {
  const category = byId.get(FALLBACK_CATEGORY_ID);
  if (category === undefined) {
    throw new Error(`Fallback category ${FALLBACK_CATEGORY_ID} is missing from the catalog`);
  }
  return category;
}

/** Lower case, umlauts as ae/oe/ue, accents removed, everything else becomes a space. */
export function normalizeFoodText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const indexed = CATEGORIES.map((category) => ({
  category,
  keywords: category.keywords.map(normalizeFoodText).filter((keyword) => keyword.length >= 3),
}));

/**
 * Guesses the category from a product name («Vollmilch», «M-Budget Bratwurst»). German compounds
 * carry their meaning at the end (Voll-milch, Basmati-reis), so a keyword matches a whole word or
 * the end of a word; multi-word keywords match as a phrase. The longest keyword wins.
 * Full receipt matching with learned aliases follows in step 4d.
 */
export function matchCategoryByName(name: string): Category | null {
  const normalized = normalizeFoodText(name);
  if (normalized === '') {
    return null;
  }
  const words = normalized.split(' ');
  let best: { category: Category; score: number } | null = null;
  for (const { category, keywords } of indexed) {
    for (const keyword of keywords) {
      const matches = keyword.includes(' ')
        ? ` ${normalized} `.includes(` ${keyword} `)
        : words.some((word) => word === keyword || word.endsWith(keyword));
      if (matches && (best === null || keyword.length > best.score)) {
        best = { category, score: keyword.length };
      }
    }
  }
  return best?.category ?? null;
}
