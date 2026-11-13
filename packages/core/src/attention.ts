import { categoryById, fallbackCategory } from './catalog/match';
import { isFreezable } from './catalog/category';
import { perishabilityOf, shelfScore } from './catalog/perishability';
import { daysBetween } from './dates';
import { rappen, type Rappen } from './money';
import type { LocalDate, StorageLocation } from './model/primitives';
import { WASTE_HABIT_MIN_TIMES } from './waste-habits';

/**
 * «Im Blick» (ADR-0073): a few articles get a quiet (i) because they deserve a closer look. It has
 * to stay rare to mean something, so every reason has a narrow rule and at most two are shown.
 */

/**
 * A Verbrauchsdatum today or tomorrow needs attention. Past dates do not: the list already says
 * «Nicht mehr verwenden» in red, and the (i) only adds what the row does not show.
 */
export const ATTENTION_SOON_DAYS = 1;
/** An article is «teuer» from this price on: CHF 6.00 in Rappen (other currencies: smallest unit). */
export const PRICEY_MIN_RAPPEN = 600;
/** Only this many of the most expensive active articles of the household count as «teuer». */
export const PRICEY_TOP_COUNT = 3;
/** At most this many reasons are shown. */
export const MAX_ATTENTION_REASONS = 2;

export type AttentionReason =
  | { kind: 'use_by' }
  | { kind: 'perishable' }
  | { kind: 'pricey'; rappen: Rappen }
  | { kind: 'often_wasted'; times: number };

export type AttentionReasonKind = AttentionReason['kind'];

export type AttentionTip = { kind: 'freeze' } | { kind: 'category'; text: string };

export interface Attention {
  /** At most two, most important first; empty = the article is not «im Blick». */
  reasons: AttentionReason[];
  /** One helpful line, only when there are reasons. */
  tip?: AttentionTip | undefined;
}

/** What the rule needs from an item (an `InventoryItem` or its view). */
export interface AttentionItem {
  id: string;
  categoryId: string;
  location: StorageLocation;
  expiresOn: LocalDate;
  expiryKind: 'best_before' | 'use_by';
  openedOn?: LocalDate | undefined;
  priceRappen?: number | undefined;
}

export interface AttentionContext {
  today: LocalDate;
  /** Ids of the most expensive active articles, see `priciestItemIds`. */
  priciestIds: ReadonlySet<string>;
  /** How often the household threw away each category recently (`products.wasteHabits`). */
  wastedTimes: ReadonlyMap<string, number>;
}

/**
 * The ids of the most expensive active articles: at least `PRICEY_MIN_RAPPEN`, among the
 * `PRICEY_TOP_COUNT` highest prices; equal prices all count (ties allowed).
 */
export function priciestItemIds(
  items: readonly { id: string; priceRappen?: number | undefined }[],
  count: number = PRICEY_TOP_COUNT,
): Set<string> {
  const priced = items.flatMap((item) =>
    item.priceRappen === undefined ? [] : [{ id: item.id, price: item.priceRappen }],
  );
  const sorted = priced.map((entry) => entry.price).sort((a, b) => b - a);
  const cut = Math.max(sorted[count - 1] ?? 0, PRICEY_MIN_RAPPEN);
  return new Set(priced.filter((entry) => entry.price >= cut).map((entry) => entry.id));
}

/** Freezer and Notvorrat keep food long, so only the fridge and the pantry raise a date alarm. */
const DATE_LOCATIONS: readonly StorageLocation[] = ['fridge', 'pantry'];

/**
 * Why an article is «im Blick», most important first: Verbrauchsdatum today or tomorrow, delicate
 * food that is open, a high price, a product the household often throws away. Plus one tip, never
 * for an article past its date.
 */
export function attentionOf(item: AttentionItem, context: AttentionContext): Attention {
  const category = categoryById(item.categoryId) ?? fallbackCategory();
  const reasons: AttentionReason[] = [];
  const dateMatters = DATE_LOCATIONS.includes(item.location);
  const daysLeft = daysBetween(context.today, item.expiresOn);

  const past = daysLeft < 0;
  if (dateMatters && item.expiryKind === 'use_by' && !past && daysLeft <= ATTENTION_SOON_DAYS) {
    reasons.push({ kind: 'use_by' });
  }
  if (
    dateMatters &&
    !past &&
    item.openedOn !== undefined &&
    perishabilityOf(shelfScore(category, { opened: true })) === 'high'
  ) {
    reasons.push({ kind: 'perishable' });
  }
  if (
    item.priceRappen !== undefined &&
    item.priceRappen >= PRICEY_MIN_RAPPEN &&
    context.priciestIds.has(item.id)
  ) {
    reasons.push({ kind: 'pricey', rappen: rappen(item.priceRappen) });
  }
  const times = context.wastedTimes.get(item.categoryId) ?? 0;
  if (times >= WASTE_HABIT_MIN_TIMES) {
    reasons.push({ kind: 'often_wasted', times });
  }

  const shown = reasons.slice(0, MAX_ATTENTION_REASONS);
  if (shown.length === 0) {
    return { reasons: [] };
  }
  // Past its date: no tip; freezing no longer helps and the row already says what to do.
  if (past) {
    return { reasons: shown };
  }
  if (isFreezable(category) && item.location !== 'freezer') {
    return { reasons: shown, tip: { kind: 'freeze' } };
  }
  const first = category.tips.de[0];
  return first === undefined
    ? { reasons: shown }
    : { reasons: shown, tip: { kind: 'category', text: first } };
}
