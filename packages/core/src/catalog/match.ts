import { CATEGORIES } from './categories';
import type { Category } from './category';
import { RECEIPT_WORDS } from './receipt-words';

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

/**
 * Lower case, umlauts as ae/oe/ue, accents removed, everything else becomes a space. OCR often
 * reads «Bio» as «Bıo» with a dotless i; it counts as an i.
 */
export function normalizeFoodText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const receiptWords = Object.entries(RECEIPT_WORDS);
const indexed = CATEGORIES.map((category) => ({
  category,
  keywords: [
    ...category.keywords,
    ...receiptWords.flatMap(([word, id]) => (id === category.id ? [word] : [])),
  ]
    .map(normalizeFoodText)
    .filter((keyword) => keyword.length >= 3),
}));

/**
 * Flavour and origin words: «Glace Schokolade», «Eistee Pfirsich», «Appenzeller Bratspeck». They
 * name the product only when nothing else does («Pfirsiche», «Appenzeller ¼ Laib»).
 */
const WEAK_WORDS = new Set(
  [
    'schokolade',
    'schoko',
    'chocolat',
    'vanille',
    'karamell',
    'caramel',
    'honig',
    'appenzeller',
    'emmentaler',
    'gruyere',
    'tilsiter',
  ].map(normalizeFoodText),
);
const WEAK_CATEGORIES = new Set(['pantry-spices']);
const isWeak = (category: Category, keyword: string) =>
  category.group === 'produce' || WEAK_CATEGORIES.has(category.id) || WEAK_WORDS.has(keyword);

/** «TK», «tiefgekühlt», «surgelé»: frozen, whatever the rest says. */
const FROZEN_MARKERS = new Set([
  'tk',
  'tiefgekuehlt',
  'tiefkuehl',
  'surgele',
  'surgeles',
  'gefroren',
]);

/**
 * Receipts cut words off: «Schmelzkäses.» is a keyword with a letter or two after it, «Knobla.» the
 * start of a keyword with at most four letters missing. Only for words and keywords of five
 * letters or more, and only when nothing else fits.
 */
const MIN_CUT = 5;
const cutOff = (word: string, keyword: string) =>
  keyword.length >= MIN_CUT &&
  ((word.length >= MIN_CUT && keyword.length - word.length <= 4 && keyword.startsWith(word)) ||
    word.slice(0, -1).endsWith(keyword) ||
    word.slice(0, -2).endsWith(keyword));

interface Hit {
  category: Category;
  score: number;
}
/** Added to the score of a keyword that is not a flavour or origin word. */
const STRONG = 100;
/**
 * Added on top for a keyword of a ready-made category (Fertigprodukt): «Skyr Cheesecake» is a
 * dessert, not yoghurt, «Sandwich Schinken» a ready meal, not cold cuts (ADR-0053).
 */
const READY = 1000;
/**
 * Added on top for a keyword of several words: it names one product exactly. «Sandwich Toast» is
 * bread for sandwiches, not a sandwich; «Butter Toast» is toast, not butter.
 */
const PHRASE = 10_000;

function bestMatch(words: readonly string[], normalized: string, cut: boolean): Hit | null {
  let best: Hit | null = null;
  for (const { category, keywords } of indexed) {
    for (const keyword of keywords) {
      const matches = keyword.includes(' ')
        ? ` ${normalized} `.includes(` ${keyword} `)
        : words.some((word) =>
            cut ? cutOff(word, keyword) : word === keyword || word.endsWith(keyword),
          );
      // Weak words count as short as possible, so any other keyword beats them.
      const weak = isWeak(category, keyword);
      const phrase = keyword.includes(' ') ? PHRASE : 0;
      const bonus = weak ? phrase : STRONG + (category.ready === true ? READY : 0) + phrase;
      const score = matches ? bonus + keyword.length : -1;
      if (score >= 0 && (best === null || score > best.score)) {
        best = { category, score };
      }
    }
  }
  return best;
}

/**
 * Guesses the category from a product name («Vollmilch», «M-Budget Bratwurst»). German compounds
 * carry their meaning at the end (Voll-milch, Basmati-reis), so a keyword matches a whole word or
 * the end of a word; multi-word keywords match as a phrase and win over single words. Then the
 * longest keyword wins, flavour and origin words only when nothing else matches, and a product
 * named before a comma wins over the flavour after it. Cut-off receipt words match a long keyword
 * inside them, and «TK» moves the guess to the freezer.
 */
export function matchCategoryByName(name: string): Category | null {
  const normalized = normalizeFoodText(name);
  if (normalized === '') {
    return null;
  }
  const words = normalized.split(' ');
  // «Reste: Lasagne», «Reste Risotto»: leftovers, whatever they are made of (ADR-0052).
  if (words[0] === 'reste' || words[0] === 'resten') {
    return byId.get('prepared-leftovers') ?? null;
  }
  // «Pouletbrüstli, Curry-Mohn», «Rührkuchen, Zitrone»: the product comes before the comma.
  const head = normalizeFoodText(name.split(',')[0] ?? '');
  const headHit = head === normalized ? null : bestMatch(head.split(' '), head, false);
  const found =
    (headHit !== null && headHit.score >= STRONG ? headHit.category : null) ??
    bestMatch(words, normalized, false)?.category ??
    bestMatch(words, normalized, true)?.category ??
    null;
  if (!words.some((word) => FROZEN_MARKERS.has(word)) || found?.group === 'frozen') {
    return found;
  }
  // «TK Erbsen», «TK Hähnchen-Cordon Bleu»: vegetables to frozen vegetables, the rest to meals.
  return byId.get(found?.group === 'produce' ? 'frozen-vegetables' : 'frozen-meals') ?? found;
}
