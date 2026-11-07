import {
  buildReport,
  categoryById,
  CONTRACT_V1,
  fallbackCategory,
  itemValue,
  toLocalDate,
  type Id,
  type ReportItem,
  type ReportOutcome,
} from '@fridgeai/core';
import type { Handler, HandlerContext } from './command';

/**
 * `reports.build` (ADR-0030): gathers the household's inventory, outcomes and receipts on the
 * device and lets `buildReport` compute the report. Nothing leaves the device.
 */
export function createReportHandler({ db, clock }: HandlerContext) {
  const build: Handler<'reports.build'> = async (raw) => {
    const { householdId, from, to } = CONTRACT_V1['reports.build'].input.parse(raw);
    const [allItems, products, outcomes, receipts] = await Promise.all([
      db.items.where('householdId').equals(householdId).toArray(),
      db.products.where('householdId').equals(householdId).toArray(),
      db.outcomes.where('householdId').equals(householdId).toArray(),
      db.receipts.where('householdId').equals(householdId).toArray(),
    ]);
    const productById = new Map(products.map((product) => [product.id, product]));
    const categoryOf = (productId: Id) =>
      categoryById(productById.get(productId)?.categoryId ?? '') ?? fallbackCategory();
    const itemById = new Map(allItems.map((item) => [item.id, item]));

    const items: ReportItem[] = allItems
      .filter((item) => item.status === 'active' && item.deletedAt === undefined)
      .map((item) => {
        const category = categoryOf(item.productId);
        const value = itemValue(
          {
            quantity: item.quantity,
            unit: item.unit,
            ...(item.priceRappen === undefined ? {} : { priceRappen: item.priceRappen }),
          },
          category,
        );
        return {
          name: productById.get(item.productId)?.name ?? category.name.de,
          categoryId: category.id,
          location: item.location,
          quantity: item.quantity,
          unit: item.unit,
          expiresOn: item.expiresOn,
          valueRappen: value.valueRappen,
          valueEstimated: value.estimated,
        };
      });
    const closed: ReportOutcome[] = outcomes.map((outcome) => {
      const item = itemById.get(outcome.itemId);
      return {
        ...outcome,
        categoryId: (item === undefined ? fallbackCategory() : categoryOf(item.productId)).id,
      };
    });
    const purchases = receipts
      .filter((receipt) => receipt.deletedAt === undefined)
      .map((receipt) => ({
        retailer: receipt.retailer,
        purchasedOn: toLocalDate(receipt.purchasedAt),
        totalRappen: receipt.totalRappen,
      }));
    return buildReport({ today: clock.today(), from, to, items, outcomes: closed, purchases });
  };
  return { 'reports.build': build };
}
