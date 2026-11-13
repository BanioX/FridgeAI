import { normalizeFoodText } from '../catalog/match';
import { addDays, daysBetween, toLocalDate } from '../dates';
import type { Id } from '../ids';
import type { LocalDate } from '../model/primitives';

/** Fewest purchase days (distinct calendar days) before a rhythm is trusted. */
export const RESTOCK_MIN_PURCHASE_DAYS = 3;
/** Rhythms outside this range (in days) are no habit worth a hint. */
export const RESTOCK_MIN_EVERY_DAYS = 2;
export const RESTOCK_MAX_EVERY_DAYS = 60;
/** At most this many suggestions are shown. */
export const RESTOCK_LIMIT = 5;

export interface RestockProduct {
  id: Id;
  name: string;
  /** «Immer da haben» (ADR-0059): products with a minimum are handled there, not here. */
  minStock?: number | undefined;
}

export interface RestockInput {
  today: LocalDate;
  /** Products of the household, soft-deleted ones already left out. */
  products: readonly RestockProduct[];
  /** One entry per bought pack, used up or not: the `purchasedAt` instant of every item. */
  purchases: readonly { productId: Id; purchasedAt: string }[];
  /** Products that have at least one open pack at home. */
  inStockProductIds: readonly Id[];
  /** Entries on the shopping list, ticked or not: their names and, if known, their products. */
  listEntries: readonly { name: string; productId?: Id | undefined }[];
}

export interface RestockSuggestion {
  productId: Id;
  name: string;
  /** The household's usual gap between two purchases, in whole days. */
  everyDays: number;
  lastBought: LocalDate;
}

/** The median of a non-empty list of numbers; the mean of the two middle ones if even. */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const high = sorted[middle] ?? 0;
  return sorted.length % 2 === 1 ? high : ((sorted[middle - 1] ?? 0) + high) / 2;
}

/**
 * «Bald wieder nötig» (ADR-0070): products the household buys at a steady rhythm and that are
 * gone at home when their usual day comes. The rhythm is the median gap between consecutive
 * purchase days (at least three days, 2 to 60 days). A product is due from the day before
 * `lastPurchaseDay + rhythm`. Not suggested: anything still in stock, anything already on the
 * list (ticked or not: ticked means it is in the basket), anything with a minimum stock. Most overdue first, at most five.
 */
export function restockSuggestions(input: RestockInput): RestockSuggestion[] {
  const daysByProduct = new Map<Id, Set<LocalDate>>();
  for (const purchase of input.purchases) {
    const days = daysByProduct.get(purchase.productId) ?? new Set<LocalDate>();
    days.add(toLocalDate(purchase.purchasedAt));
    daysByProduct.set(purchase.productId, days);
  }
  const inStock = new Set(input.inStockProductIds);
  const listedNames = new Set(input.listEntries.map((entry) => normalizeFoodText(entry.name)));
  const listedIds = new Set(input.listEntries.flatMap((entry) => entry.productId ?? []));
  const due: (RestockSuggestion & { overdue: number })[] = [];

  for (const product of input.products) {
    if (product.minStock !== undefined || inStock.has(product.id) || listedIds.has(product.id)) {
      continue;
    }
    if (listedNames.has(normalizeFoodText(product.name))) {
      continue;
    }
    const days = [...(daysByProduct.get(product.id) ?? [])].sort();
    const lastBought = days[days.length - 1];
    if (lastBought === undefined || days.length < RESTOCK_MIN_PURCHASE_DAYS) {
      continue;
    }
    const gaps: number[] = [];
    for (let index = 1; index < days.length; index += 1) {
      const gap = daysBetween(days[index - 1] ?? lastBought, days[index] ?? lastBought);
      if (gap > 0) {
        gaps.push(gap);
      }
    }
    if (gaps.length === 0) {
      continue;
    }
    const everyDays = Math.round(median(gaps));
    if (everyDays < RESTOCK_MIN_EVERY_DAYS || everyDays > RESTOCK_MAX_EVERY_DAYS) {
      continue;
    }
    const overdue = daysBetween(addDays(lastBought, everyDays), input.today);
    if (overdue < -1) {
      continue;
    }
    due.push({ productId: product.id, name: product.name, everyDays, lastBought, overdue });
  }

  return due
    .sort((a, b) => b.overdue - a.overdue || a.name.localeCompare(b.name, 'de-CH'))
    .slice(0, RESTOCK_LIMIT)
    .map(({ productId, name, everyDays, lastBought }) => ({
      productId,
      name,
      everyDays,
      lastBought,
    }));
}
