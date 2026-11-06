import type { Clock, Gtin, ProductCatalog, ProductInfo } from '@fridgeai/core';
import type { FridgeDb } from './db';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Remembers what an open product database said about a barcode (step 10b): the next scan of the
 * same product works offline, and adding the item can store brand, nutrition and Nutri-Score
 * without asking the network inside a database transaction. Unknown barcodes are not cached, so
 * a product added to the database later is found next time.
 */
export function cachedCatalog(
  db: FridgeDb,
  source: ProductCatalog,
  clock: Clock,
  maxAgeDays = 30,
): ProductCatalog {
  return {
    async lookupByGtin(gtin: Gtin): Promise<ProductInfo | null> {
      const cached = await db.catalogCache.get(gtin);
      const age =
        cached === undefined ? Infinity : Date.parse(clock.now()) - Date.parse(cached.fetchedAt);
      if (cached !== undefined && age < maxAgeDays * DAY_MS) {
        return cached.info;
      }
      const found = await source.lookupByGtin(gtin);
      if (found !== null) {
        await db.catalogCache.put({ gtin, info: found, fetchedAt: clock.now() });
        return found;
      }
      // Offline or gone from the database: an old answer is better than none.
      return cached?.info ?? null;
    },
  };
}
