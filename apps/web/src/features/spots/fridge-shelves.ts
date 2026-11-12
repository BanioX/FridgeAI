/**
 * The usual compartments of a fridge as ready-made spots (docs/ideen/alltag-und-ordnung.md, O5),
 * and which one suits a category. The rule follows what «Wissen» already says: the coldest place
 * is at the bottom above the vegetable drawer (meat and fish), the door is the warmest (drinks,
 * butter, sauces), vegetables and fruit go into the drawer, ready food and leftovers on top.
 */
export const FRIDGE_SHELVES = ['door', 'top', 'middle', 'bottom', 'drawer'] as const;
export type FridgeShelf = (typeof FRIDGE_SHELVES)[number];

const DOOR = new Set(['dairy-milk', 'dairy-uht-milk', 'dairy-butter', 'pantry-sauces']);

/** The compartment that suits a category best, by the rules above. */
export function shelfFor(categoryId: string): FridgeShelf {
  if (DOOR.has(categoryId) || categoryId.startsWith('drinks-')) {
    return 'door';
  }
  if (categoryId.startsWith('meat-') || categoryId.startsWith('fish-')) {
    return 'bottom';
  }
  if (categoryId.startsWith('produce-')) {
    return 'drawer';
  }
  if (categoryId.startsWith('prepared-') || categoryId === 'bakery-homemade') {
    return 'top';
  }
  return 'middle';
}

/**
 * The compartments to offer as a new spot: the one that suits the item first, then the others in
 * the fridge's order, leaving out names the household already uses.
 */
export function shelfSuggestions(
  categoryId: string,
  names: Record<FridgeShelf, string>,
  taken: readonly string[],
): { shelf: FridgeShelf; name: string; suits: boolean }[] {
  const used = new Set(taken.map((name) => name.trim().toLowerCase()));
  const best = shelfFor(categoryId);
  return [best, ...FRIDGE_SHELVES.filter((shelf) => shelf !== best)]
    .map((shelf) => ({ shelf, name: names[shelf], suits: shelf === best }))
    .filter(({ name }) => !used.has(name.toLowerCase()));
}
