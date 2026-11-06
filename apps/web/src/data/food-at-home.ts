import {
  categoryById,
  fallbackCategory,
  type FoodAtHome,
  type InventoryItem,
  type Product,
} from '@fridgeai/core';

/** Active, not deleted items as the recipe ranking sees them: name, category and date. */
export function toFoodAtHome(
  items: readonly InventoryItem[],
  products: readonly Product[],
): FoodAtHome[] {
  const productById = new Map(products.map((product) => [product.id, product]));
  return items
    .filter((item) => item.deletedAt === undefined && item.quantity > 0)
    .map((item) => {
      const product = productById.get(item.productId);
      const category = (product && categoryById(product.categoryId)) ?? fallbackCategory();
      return {
        name: product?.name ?? category.name.de,
        categoryId: category.id,
        expiresOn: item.expiresOn,
        expiryKind: item.expiryKind,
      };
    });
}
