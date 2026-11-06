import {
  categoryById,
  fallbackCategory,
  type FoodAtHome,
  type Id,
  type InventoryItem,
  type Product,
  type Unit,
} from '@fridgeai/core';

/** An active item as the recipes see it, with what «nach dem Kochen abbuchen» needs. */
export interface ItemAtHome extends FoodAtHome {
  itemId: Id;
  quantity: number;
  unit: Unit;
}

/** Active, not deleted items as the recipe ranking sees them: name, category and date. */
export function toFoodAtHome(
  items: readonly InventoryItem[],
  products: readonly Product[],
): ItemAtHome[] {
  const productById = new Map(products.map((product) => [product.id, product]));
  return items
    .filter((item) => item.deletedAt === undefined && item.quantity > 0)
    .map((item) => {
      const product = productById.get(item.productId);
      const category = (product && categoryById(product.categoryId)) ?? fallbackCategory();
      return {
        itemId: item.id,
        quantity: item.quantity,
        unit: item.unit,
        name: product?.name ?? category.name.de,
        categoryId: category.id,
        expiresOn: item.expiresOn,
        expiryKind: item.expiryKind,
      };
    });
}
