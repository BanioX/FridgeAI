import { matchCategoryByName, normalizeFoodText } from '../catalog/match';
import { parseExpiryFromText, type ExpiryFromText } from '../expiry-from-text';
import type { CategoryId, LocalDate } from '../model/primitives';
import type { ProductSearchHit } from '../ports';
import { parsePackSize } from '../receipt/off-match';

/** What the text on a pack says, read on the device (ADR-0068). Everything is a suggestion. */
export interface LabelReading {
  expiry?: ExpiryFromText;
  /** Grams, millilitres or pieces, as printed on the front («500 g», «1 l», «6 Eier»). */
  amount?: { quantity: number; unit: 'g' | 'ml' | 'pcs' };
  /** The words worth looking up in the catalogue: the front of the pack, without small print. */
  query: string;
  categoryId?: CategoryId;
}

/** From here on the back of the pack begins: ingredients, nutrition, storage. */
const SMALL_PRINT =
  /\b(zutaten|ingredients?|ingredienti|ingr[eé]dients?|n[aä]hrwerte?|nutrition|valeurs nutritives|valori nutrizionali|zusammensetzung)\b/i;

/** Words on nearly every pack that name no product. */
const NOISE = new Set(
  [
    'mindestens',
    'haltbar',
    'bis',
    'zu',
    'verbrauchen',
    'aufbewahren',
    'gekuehlt',
    'kuehl',
    'trocken',
    'lagern',
    'bei',
    'max',
    'inhalt',
    'netto',
    'nettogewicht',
    'gewicht',
    'schweiz',
    'suisse',
    'svizzera',
    'swiss',
    'hergestellt',
    'produziert',
    'fuer',
    'pour',
    'per',
    'pro',
    'und',
    'mit',
    'avec',
    'con',
    'des',
    'les',
    'der',
    'die',
    'das',
    'www',
    'com',
  ].map(normalizeFoodText),
);

const MAX_QUERY_WORDS = 24;

/** The front: everything before the first ingredient or nutrition heading. */
function frontOf(text: string): string {
  const lines = text.split(/\r?\n/);
  const end = lines.findIndex((line) => SMALL_PRINT.test(line));
  return (end <= 0 ? lines : lines.slice(0, end)).join('\n');
}

/** Words of three letters or more, no numbers, no noise, each once, in reading order. */
function queryOf(front: string): string {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const word of normalizeFoodText(front).split(' ')) {
    if (word.length < 3 || /\d/.test(word) || NOISE.has(word) || seen.has(word)) {
      continue;
    }
    seen.add(word);
    words.push(word);
  }
  return words.slice(0, MAX_QUERY_WORDS).join(' ');
}

/** «pro 100 g», «per 100 ml», «je Portion»: the size of a serving, not of the pack. */
const SERVING_BEFORE = /\b(pro|per|je|pour|par|portion|davon)\s*$/i;
const PIECES = /\b(\d{1,3})\s*(stueck|stk|scheiben|eier|pieces|pcs|tranches|fette)\b/;

function amountOf(front: string): LabelReading['amount'] {
  const sizes = /(\d+(?:[.,]\d+)?)\s*(kg|g|l|cl|dl|ml)\b/gi;
  for (const match of front.matchAll(sizes)) {
    if (SERVING_BEFORE.test(front.slice(Math.max(0, match.index - 12), match.index))) {
      continue;
    }
    const pack = parsePackSize(match[0]);
    if (pack !== null) {
      return { quantity: pack.amount, unit: pack.unit };
    }
  }
  const pieces = PIECES.exec(normalizeFoodText(front));
  const count = Number(pieces?.[1] ?? 0);
  return count >= 1 ? { quantity: count, unit: 'pcs' } : undefined;
}

/**
 * Reads what matters from the OCR text of a pack: the date (anywhere, it is often on the back),
 * the amount and the words of the front for the catalogue search, and a category guess. Pure text
 * logic; the photo and its text never leave the device.
 */
export function readLabel(text: string, today: LocalDate): LabelReading {
  const front = frontOf(text);
  const query = queryOf(front);
  const expiry = parseExpiryFromText(text, today) ?? undefined;
  const amount = amountOf(front);
  const category = query === '' ? null : matchCategoryByName(query);
  return {
    ...(expiry === undefined ? {} : { expiry }),
    ...(amount === undefined ? {} : { amount }),
    query,
    ...(category === null ? {} : { categoryId: category.id }),
  };
}

/**
 * Catalogue hits that fit the label: most of the product's own words are printed on it. A label
 * carries far more words than a product name, so the share of the product's words counts, not the
 * share of the label's. At most `limit`, best first; the person picks one or none.
 */
export function rankLabelHits(
  query: string,
  hits: readonly ProductSearchHit[],
  limit = 3,
): ProductSearchHit[] {
  const printed = new Set(query.split(' ').filter((word) => word !== ''));
  return hits
    .map((hit) => {
      const own = [
        ...new Set(
          normalizeFoodText(`${hit.name} ${hit.brand ?? ''}`)
            .split(' ')
            .filter((word) => word.length >= 3 && !/\d/.test(word)),
        ),
      ];
      const shared = own.filter((word) => printed.has(word)).length;
      return { hit, shared, share: own.length === 0 ? 0 : shared / own.length };
    })
    .filter((entry) => entry.shared >= 2 && entry.share >= 0.5)
    .sort((a, b) => b.share - a.share || b.shared - a.shared)
    .slice(0, limit)
    .map((entry) => entry.hit);
}
