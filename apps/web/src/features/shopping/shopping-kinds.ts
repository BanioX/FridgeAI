import { matchCategoryByName } from '@fridgeai/core';
import { kindOf, type Kind, type KindGroup } from '../inventory/item-kinds';

/**
 * «Nachkaufen nach Art» (ADR-0071): the kinds as a walk through a Swiss shop, not by what spoils
 * first. Fruit and vegetables at the entrance, bakery next, then the rest.
 */
export const SHOP_ORDER = [
  'fruit',
  'vegetables',
  'bakery',
  'dairy',
  'meat',
  'fish',
  'leftovers',
  'ready',
  'sweets',
  'drinks',
  'grains',
  'tins',
  'spices',
  'rations',
  'household',
  'other',
] as const satisfies readonly Kind[];

interface ShoppingEntryLike {
  name: string;
  categoryId?: string | undefined;
}

/** The entry's own category if it has one, else a guess from its name; without either, «other». */
export function shoppingKindOf(entry: ShoppingEntryLike): Kind {
  const categoryId = entry.categoryId ?? matchCategoryByName(entry.name)?.id ?? '';
  return kindOf({ categoryId });
}

/** The open entries by kind in shop order; inside a kind the list order stays. */
export function groupShopping<T extends ShoppingEntryLike>(entries: readonly T[]): KindGroup<T>[] {
  const kinds = new Map<T, Kind>(entries.map((entry) => [entry, shoppingKindOf(entry)]));
  return SHOP_ORDER.flatMap((kind) => {
    const items = entries.filter((entry) => kinds.get(entry) === kind);
    return items.length === 0 ? [] : [{ kind, items }];
  });
}
