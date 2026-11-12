import { categoryById, fallbackCategory } from '../catalog/match';
import type { Category } from '../catalog/category';
import type { InventoryItemView } from '../contract/operations';
import type { Id } from '../ids';
import type { InventoryItem, Product, StorageSpot } from '../model/inventory';
import type { Retailer } from '../model/primitives';
import type { Storage } from '../ports/storage';
import { freshNutrition } from '../nutrition/fresh-nutrition';
import { CommandError } from './command';

export const EPSILON = 1e-9;

export function categoryOf(product: Product | undefined): Category {
  return (product && categoryById(product.categoryId)) ?? fallbackCategory();
}

export type ProductFacts = Pick<
  Product,
  'brand' | 'packSize' | 'nutrition' | 'nutriScore' | 'allergens'
>;

/** Only the facts that are there (exactOptionalPropertyTypes: no `undefined` values). */
export function factsOf(source: ProductFacts | undefined): ProductFacts {
  return {
    ...(source?.brand === undefined ? {} : { brand: source.brand }),
    ...(source?.packSize === undefined ? {} : { packSize: source.packSize }),
    ...(source?.nutrition === undefined ? {} : { nutrition: source.nutrition }),
    ...(source?.nutriScore === undefined ? {} : { nutriScore: source.nutriScore }),
    ...(source?.allergens === undefined ? {} : { allergens: source.allergens }),
  };
}

export function toView(
  item: InventoryItem,
  product: Product | undefined,
  retailer?: Retailer,
  madeFromNames?: readonly string[],
  spots?: ReadonlyMap<Id, StorageSpot>,
): InventoryItemView {
  const category = categoryOf(product);
  const spot = product?.spotId === undefined ? undefined : spots?.get(product.spotId);
  const name = product?.name ?? category.name.de;
  // Own values (database, photo, manual) win; unprocessed fresh food gets an estimate, computed
  // here and never stored (ADR-0064).
  const estimate =
    product?.nutrition === undefined
      ? freshNutrition({ name, categoryId: category.id })
      : undefined;
  return {
    id: item.id,
    productId: item.productId,
    name,
    emoji: category.emoji,
    categoryId: category.id,
    location: item.location,
    quantity: item.quantity,
    unit: item.unit,
    expiresOn: item.expiresOn,
    expiryKind: item.expiryKind,
    expirySource: item.expirySource,
    owner: item.owner,
    ...(item.priceRappen === undefined ? {} : { priceRappen: item.priceRappen }),
    ...(item.priceEstimated === true ? { priceEstimated: true } : {}),
    ...(item.origin === undefined ? {} : { origin: item.origin }),
    ...(madeFromNames === undefined || madeFromNames.length === 0
      ? {}
      : { madeFrom: [...madeFromNames] }),
    ...(item.container === undefined ? {} : { container: item.container }),
    ...(item.packageSize === undefined ? {} : { packageSize: item.packageSize }),
    ...(item.openedOn === undefined ? {} : { openedOn: item.openedOn }),
    ...(item.fromCounter === true ? { fromCounter: true } : {}),
    ...(item.frozenOn === undefined ? {} : { frozenOn: item.frozenOn }),
    ...(item.thawedOn === undefined ? {} : { thawedOn: item.thawedOn }),
    ...(item.readyMade === undefined ? {} : { readyMade: item.readyMade }),
    purchasedAt: item.purchasedAt,
    ...factsOf(product),
    ...(estimate === undefined
      ? {}
      : { nutrition: estimate.nutrition, nutritionFood: estimate.food }),
    ...(product === undefined ? {} : { productSource: product.source }),
    ...(product?.gtin === undefined ? {} : { gtin: product.gtin }),
    ...(retailer === undefined ? {} : { retailer }),
    ...(product?.minStock === undefined ? {} : { minStock: product.minStock }),
    // Only in the location the spot lies in: after a move the pantry spot stays hidden.
    spot:
      spot === undefined || spot.deletedAt !== undefined || spot.location !== item.location
        ? null
        : { id: spot.id, name: spot.name, hasPhoto: spot.photo !== undefined },
  };
}

/**
 * Item id → the shop it was bought at (item → receipt line → receipt). Loads lines and receipts
 * once; soft-deleted rows and the unknown shop «other» give no entry.
 */
export async function retailersOfItems(
  storage: Storage,
  householdId: Id,
  items: readonly InventoryItem[],
): Promise<Map<Id, Retailer>> {
  const bought = items.filter((item) => item.receiptLineId !== undefined);
  const result = new Map<Id, Retailer>();
  if (bought.length === 0) {
    return result;
  }
  const [lines, receipts] = await Promise.all([
    storage.receiptLines.ofHousehold(householdId),
    storage.receipts.ofHousehold(householdId),
  ]);
  const lineById = new Map(
    lines.filter((line) => line.deletedAt === undefined).map((line) => [line.id, line]),
  );
  const receiptById = new Map(
    receipts.filter((receipt) => receipt.deletedAt === undefined).map((r) => [r.id, r]),
  );
  for (const item of bought) {
    const line = item.receiptLineId === undefined ? undefined : lineById.get(item.receiptLineId);
    const retailer = line === undefined ? undefined : receiptById.get(line.receiptId)?.retailer;
    if (retailer !== undefined && retailer !== 'other') {
      result.set(item.id, retailer);
    }
  }
  return result;
}

/** The item if it is still at home and belongs to the household; else a `CommandError`. */
export async function activeItem(
  storage: Storage,
  householdId: Id,
  itemId: Id,
): Promise<InventoryItem> {
  const item = await storage.items.get(itemId);
  if (item?.householdId !== householdId || item.deletedAt !== undefined) {
    throw new CommandError('not_found', `Item ${itemId} not found`);
  }
  if (item.status !== 'active') {
    throw new CommandError('not_active', `Item ${itemId} is already closed`);
  }
  return item;
}
