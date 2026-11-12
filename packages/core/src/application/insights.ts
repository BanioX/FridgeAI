import { categoryById, fallbackCategory, normalizeFoodText } from '../catalog/match';
import { CONTRACT_V1, type FrequentProduct } from '../contract/operations';
import { toLocalDate } from '../dates';
import { frequentProducts } from '../frequent-products';
import type { Id } from '../ids';
import type { InventoryItem } from '../model/inventory';
import { rappen } from '../money';
import { summarizePrices, type PriceObservation } from '../prices/price-memory';
import { buildReport, type ReportItem, type ReportOutcome } from '../reports/report';
import { itemValue } from '../value';
import { WASTE_HABIT_DAYS, wasteHabits } from '../waste-habits';
import type { AppContext, UseCase } from './command';
import { retailersOfItems } from './inventory-shared';

/** Additions older than this do not count: habits change, and old data should fade (ADR-0020). */
const FREQUENT_WINDOW_DAYS = 180;

type Last = Pick<InventoryItem, 'location' | 'quantity' | 'unit' | 'container' | 'packageSize'>;

/**
 * What the household's own data tells it (ADR-0034, layer 2): the usual products, the prices it
 * paid and the report. Read-only, via the ports; nothing leaves the device.
 */
export function createInsightQueries({ storage, clock }: AppContext) {
  /**
   * `products.frequent` (UC-07): what the household adds most often, with the amount it added the
   * last time. Deleted items were mistakes and do not count; for eaten or thrown away items the
   * amount is restored from their outcomes, so «2 Becher» stays «2 Becher».
   */
  const frequent: UseCase<'products.frequent'> = async (raw) => {
    const input = CONTRACT_V1['products.frequent'].input.parse(raw);
    const since = new Date(
      Date.parse(clock.now()) - FREQUENT_WINDOW_DAYS * 86_400_000,
    ).toISOString();
    const [items, products, outcomes] = await Promise.all([
      storage.items.ofHousehold(input.householdId),
      storage.products.ofHousehold(input.householdId),
      storage.outcomes.ofHousehold(input.householdId),
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

  /**
   * `prices.memory` (ADR-0029): the household's own receipt prices per product. Products are
   * matched by their name on the receipt, written the same way.
   */
  const prices: UseCase<'prices.memory'> = async (raw) => {
    const input = CONTRACT_V1['prices.memory'].input.parse(raw);
    const [receipts, lines] = await Promise.all([
      storage.receipts.ofHousehold(input.householdId),
      storage.receiptLines.ofHousehold(input.householdId),
    ]);
    const receiptById = new Map(
      receipts.filter((receipt) => receipt.deletedAt === undefined).map((r) => [r.id, r]),
    );
    const byName = new Map<string, PriceObservation[]>();
    for (const line of lines) {
      const receipt = receiptById.get(line.receiptId);
      if (receipt === undefined || line.deletedAt !== undefined || line.kind !== 'item') {
        continue;
      }
      const key = normalizeFoodText(line.name);
      const observations = byName.get(key) ?? [];
      observations.push({
        retailer: receipt.retailer,
        ...(receipt.storeName === undefined ? {} : { storeName: receipt.storeName }),
        purchasedOn: toLocalDate(receipt.purchasedAt),
        quantity: line.quantity,
        unit: line.unit,
        paidRappen: rappen(line.priceRappen + line.discountRappen),
        promotion: line.discountRappen < 0,
      });
      byName.set(key, observations);
    }
    const today = clock.today();
    return {
      products: input.names.map((name) => {
        const summary = summarizePrices(byName.get(normalizeFoodText(name)) ?? [], today);
        return summary === null ? { name, count: 0 } : { name, ...summary };
      }),
    };
  };

  /**
   * `reports.build` (ADR-0030): gathers the household's inventory, outcomes and receipts and lets
   * `buildReport` compute the report.
   */
  const report: UseCase<'reports.build'> = async (raw) => {
    const { householdId, from, to } = CONTRACT_V1['reports.build'].input.parse(raw);
    const [allItems, products, outcomes, receipts] = await Promise.all([
      storage.items.ofHousehold(householdId),
      storage.products.ofHousehold(householdId),
      storage.outcomes.ofHousehold(householdId),
      storage.receipts.ofHousehold(householdId),
    ]);
    const productById = new Map(products.map((product) => [product.id, product]));
    const categoryOf = (productId: Id) =>
      categoryById(productById.get(productId)?.categoryId ?? '') ?? fallbackCategory();
    const itemById = new Map(allItems.map((item) => [item.id, item]));

    const activeItems = allItems.filter(
      (item) => item.status === 'active' && item.deletedAt === undefined,
    );
    const retailers = await retailersOfItems(storage, householdId, activeItems);
    const items: ReportItem[] = activeItems.map((item) => {
      const category = categoryOf(item.productId);
      const value = itemValue(
        {
          quantity: item.quantity,
          unit: item.unit,
          ...(item.priceRappen === undefined ? {} : { priceRappen: item.priceRappen }),
          ...(item.priceEstimated === true ? { priceEstimated: true } : {}),
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
        expiryKind: item.expiryKind,
        valueRappen: value.valueRappen,
        valueEstimated: value.estimated,
        ...(retailers.has(item.id) ? { retailer: retailers.get(item.id) } : {}),
      };
    });
    const closed: ReportOutcome[] = outcomes.map((outcome) => {
      const item = itemById.get(outcome.itemId);
      const category = item === undefined ? fallbackCategory() : categoryOf(item.productId);
      return {
        ...outcome,
        categoryId: category.id,
        name:
          (item === undefined ? undefined : productById.get(item.productId)?.name) ??
          category.name.de,
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

  /** `products.wasteHabits` (ADR-0038): categories thrown away at least twice in 90 days. */
  const habits: UseCase<'products.wasteHabits'> = async (raw) => {
    const input = CONTRACT_V1['products.wasteHabits'].input.parse(raw);
    const [items, products, outcomes] = await Promise.all([
      storage.items.ofHousehold(input.householdId),
      storage.products.ofHousehold(input.householdId),
      storage.outcomes.ofHousehold(input.householdId),
    ]);
    const productById = new Map<string, (typeof products)[number]>(
      products.map((product) => [product.id, product]),
    );
    const itemById = new Map<string, (typeof items)[number]>(items.map((item) => [item.id, item]));
    const since = new Date(Date.parse(clock.now()) - WASTE_HABIT_DAYS * 86_400_000).toISOString();
    return {
      habits: wasteHabits({
        outcomes,
        since,
        itemInfo: (itemId) => {
          const product = productById.get(itemById.get(itemId)?.productId ?? '');
          return product === undefined
            ? undefined
            : { name: product.name, categoryId: product.categoryId };
        },
      }),
    };
  };

  return {
    'products.frequent': frequent,
    'products.wasteHabits': habits,
    'prices.memory': prices,
    'reports.build': report,
  };
}
