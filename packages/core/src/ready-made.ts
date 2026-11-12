import { categoryById } from './catalog/match';

/** What «Zutat oder Fertigprodukt» needs from an item (an `InventoryItem` or its view). */
export interface ReadySource {
  categoryId: string;
  /** The household's own call: true = Fertigprodukt, false = Zum Kochen; absent = the category. */
  readyMade?: boolean | undefined;
}

/**
 * Whether an item is a Fertigprodukt (ADR-0053): what the item says wins, else its category
 * (ready meals, desserts, sweets, ice cream). Everything else counts as an ingredient.
 */
export function isReadyMade(item: ReadySource): boolean {
  return item.readyMade ?? categoryById(item.categoryId)?.ready === true;
}
