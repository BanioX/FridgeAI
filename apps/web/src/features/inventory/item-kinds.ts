import { categoryById, type CategoryGroup, type InventoryItemView } from '@fridgeai/core';

/**
 * «Nach Art» in the Vorrat (ADR-0067): the kinds a person sorts a fridge by, in the order of what
 * spoils first. Fish and meat lead, the household things come last.
 */
export const KINDS = [
  'fish',
  'meat',
  'leftovers',
  'dairy',
  'vegetables',
  'fruit',
  'bakery',
  'ready',
  'sweets',
  'drinks',
  'grains',
  'tins',
  'spices',
  'rations',
  'household',
  'other',
] as const;
export type Kind = (typeof KINDS)[number];

/** The kind of each catalogue group; the categories below move to where a person looks for them. */
const BY_GROUP: Record<CategoryGroup, Kind> = {
  fish: 'fish',
  meat: 'meat',
  dairy: 'dairy',
  produce: 'vegetables',
  bakery: 'bakery',
  prepared: 'ready',
  frozen: 'ready',
  drinks: 'drinks',
  pantry: 'grains',
  reserve: 'rations',
  non_food: 'household',
};

/** Fruit apart from vegetables, sweets together, sauces next to the tins, water with the drinks. */
const BY_CATEGORY: Partial<Record<string, Kind>> = {
  'produce-berries': 'fruit',
  'produce-apples': 'fruit',
  'produce-bananas': 'fruit',
  'produce-citrus': 'fruit',
  'produce-avocado': 'fruit',
  'produce-fruit': 'fruit',
  'frozen-vegetables': 'vegetables',
  'prepared-leftovers': 'leftovers',
  'prepared-desserts': 'sweets',
  'frozen-icecream': 'sweets',
  'pantry-sweets': 'sweets',
  'pantry-canned': 'tins',
  'pantry-sauces': 'tins',
  'pantry-tomato-paste': 'tins',
  'pantry-oil': 'spices',
  'pantry-spices': 'spices',
  'pantry-coffee-tea': 'drinks',
  'reserve-water': 'drinks',
  'pantry-other': 'other',
};

/** One picture per kind, for the tiles and the block headings. */
export const KIND_EMOJI: Record<Kind, string> = {
  fish: '🐟',
  meat: '🥩',
  leftovers: '🍱',
  dairy: '🧀',
  vegetables: '🥦',
  fruit: '🍎',
  bakery: '🍞',
  ready: '🥗',
  sweets: '🍫',
  drinks: '🧃',
  grains: '🍝',
  tins: '🥫',
  spices: '🧂',
  rations: '🎒',
  household: '🧻',
  other: '🛒',
};

type Sortable = Pick<InventoryItemView, 'categoryId' | 'origin'>;

export function kindOf(item: Sortable): Kind {
  // Reste from «Verarbeiten» (ADR-0052) count as Reste, whatever category they carry.
  if (item.origin === 'leftover') {
    return 'leftovers';
  }
  const moved = BY_CATEGORY[item.categoryId];
  if (moved !== undefined) {
    return moved;
  }
  const category = categoryById(item.categoryId);
  return category === undefined ? 'other' : BY_GROUP[category.group];
}

export interface KindGroup<T> {
  kind: Kind;
  items: T[];
}

/**
 * The items by kind in the order of `KINDS` (or of `order`, which lists every kind once); inside a
 * kind the given order stays (soonest first).
 */
export function groupByKind<T extends Sortable>(
  items: readonly T[],
  order: readonly Kind[] = KINDS,
): KindGroup<T>[] {
  const byKind = new Map<Kind, T[]>();
  for (const item of items) {
    const kind = kindOf(item);
    const list = byKind.get(kind);
    if (list === undefined) {
      byKind.set(kind, [item]);
    } else {
      list.push(item);
    }
  }
  return order.flatMap((kind) => {
    const list = byKind.get(kind);
    return list === undefined ? [] : [{ kind, items: list }];
  });
}
