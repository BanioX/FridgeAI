import type { Category } from './catalog/category';
import { rappen, type Rappen } from './money';
import type { Unit } from './model/primitives';

/**
 * Estimated value and weight of a quantity of food from its category's typical pack
 * (used when no receipt price is known; always marked as an estimate in the UI).
 * `pcs` counts packs; grams and millilitres are related to the typical pack weight.
 */
export function estimateFromCategory(
  quantity: number,
  unit: Unit,
  category: Pick<Category, 'avgPriceRappen' | 'avgWeightGrams'>,
): { valueRappen: Rappen; grams: number | undefined } {
  const price = category.avgPriceRappen ?? 0;
  if (unit === 'pcs') {
    return {
      valueRappen: rappen(Math.round(price * quantity)),
      grams:
        category.avgWeightGrams === undefined
          ? undefined
          : Math.round(category.avgWeightGrams * quantity),
    };
  }
  const packs = category.avgWeightGrams === undefined ? 1 : quantity / category.avgWeightGrams;
  return { valueRappen: rappen(Math.round(price * packs)), grams: Math.round(quantity) };
}

/** Current value of an item: its remaining receipt price if known, else the category estimate. */
export function itemValue(
  item: { quantity: number; unit: Unit; priceRappen?: Rappen },
  category: Pick<Category, 'avgPriceRappen' | 'avgWeightGrams'>,
): { valueRappen: Rappen; estimated: boolean } {
  if (item.priceRappen !== undefined) {
    return { valueRappen: item.priceRappen, estimated: false };
  }
  return {
    valueRappen: estimateFromCategory(item.quantity, item.unit, category).valueRappen,
    estimated: true,
  };
}
