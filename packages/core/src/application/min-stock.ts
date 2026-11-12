import { normalizeFoodText } from '../catalog/match';
import type { Id } from '../ids';
import { ShoppingListItemSchema } from '../model/inventory';
import { createCommandKit, type AppContext } from './command';

/**
 * «Immer da haben» (ADR-0059): after an outcome, a product with a minimum stock that has fewer
 * active packs left goes onto «Nachkaufen», unless an open entry for it is there already. Written
 * like `shopping.addItem` writes it (same row, same event), marked `source: 'min_stock'`. Call it
 * inside the command transaction of the outcome. Answers whether a row was added.
 */
export function createMinStockEnsurer(ctx: AppContext) {
  const { storage, clock, ids, actor } = ctx;
  const { event } = createCommandKit(ctx);

  return async function ensureMinStock(householdId: Id, productId: Id): Promise<boolean> {
    const product = await storage.products.get(productId);
    if (
      product?.householdId !== householdId ||
      product.deletedAt !== undefined ||
      product.minStock === undefined
    ) {
      return false;
    }
    const packs = (await storage.items.activeOf(householdId)).filter(
      (item) => item.productId === productId && item.deletedAt === undefined,
    );
    if (packs.length >= product.minStock) {
      return false;
    }
    const normalized = normalizeFoodText(product.name);
    const open = (await storage.shoppingItems.ofHousehold(householdId)).some(
      (row) =>
        row.deletedAt === undefined &&
        !row.checked &&
        (row.productId === product.id || normalizeFoodText(row.name) === normalized),
    );
    if (open) {
      return false;
    }
    const row = ShoppingListItemSchema.parse({
      id: ids.next(),
      householdId,
      updatedAt: clock.now(),
      name: product.name.slice(0, 80),
      productId: product.id,
      categoryId: product.categoryId,
      checked: false,
      addedBy: actor,
      source: 'min_stock',
    });
    await storage.shoppingItems.add(row);
    await storage.events.append(
      event(householdId, 'shopping_list.item_added', {
        shoppingItemId: row.id,
        name: row.name,
      }),
    );
    return true;
  };
}
