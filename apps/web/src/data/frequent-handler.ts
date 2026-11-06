import {
  categoryById,
  CONTRACT_V1,
  fallbackCategory,
  frequentProducts,
  type FrequentProduct,
  type InventoryItem,
} from '@fridgeai/core';
import type { Handler, HandlerContext } from './command';

/** Additions older than this do not count: habits change, and old data should fade (ADR-0020). */
const WINDOW_DAYS = 180;

type Last = Pick<InventoryItem, 'location' | 'quantity' | 'unit' | 'container' | 'packageSize'>;

/**
 * `products.frequent` (UC-07): what the household adds most often, with the amount it added the
 * last time. Deleted items were mistakes and do not count; for eaten or thrown away items the
 * amount is restored from their outcomes, so «2 Becher» stays «2 Becher».
 */
export function createFrequentProductsHandler({ db, clock }: HandlerContext) {
  const frequent: Handler<'products.frequent'> = async (raw) => {
    const input = CONTRACT_V1['products.frequent'].input.parse(raw);
    const since = new Date(Date.parse(clock.now()) - WINDOW_DAYS * 86_400_000).toISOString();
    const [items, products, outcomes] = await Promise.all([
      db.items.where('householdId').equals(input.householdId).toArray(),
      db.products.where('householdId').equals(input.householdId).toArray(),
      db.outcomes.where('householdId').equals(input.householdId).toArray(),
    ]);
    const used = new Map<string, number>();
    for (const outcome of outcomes) {
      if (outcome.deletedAt === undefined) {
        used.set(outcome.itemId, (used.get(outcome.itemId) ?? 0) + outcome.quantity);
      }
    }
    const productById = new Map(products.map((product) => [product.id, product]));
    const ranked = frequentProducts<Last>(
      items
        .filter((item) => item.deletedAt === undefined && item.purchasedAt >= since)
        .map((item) => ({
          productId: item.productId,
          addedAt: item.purchasedAt,
          last: {
            location: item.location,
            // Rounded like the inventory: adding back portions must not leave 0.30000000000000004.
            quantity: Math.round((item.quantity + (used.get(item.id) ?? 0)) * 10_000) / 10_000,
            unit: item.unit,
            ...(item.container === undefined ? {} : { container: item.container }),
            ...(item.packageSize === undefined ? {} : { packageSize: item.packageSize }),
          },
        })),
      input.limit,
    );
    return {
      products: ranked.flatMap(({ productId, timesAdded, last }): FrequentProduct[] => {
        const product = productById.get(productId);
        if (product === undefined || product.deletedAt !== undefined) {
          return [];
        }
        const category = categoryById(product.categoryId) ?? fallbackCategory();
        return [
          {
            name: product.name,
            emoji: category.emoji,
            categoryId: category.id,
            ...(product.gtin === undefined ? {} : { gtin: product.gtin }),
            timesAdded,
            ...last,
          },
        ];
      }),
    };
  };
  return { 'products.frequent': frequent };
}
