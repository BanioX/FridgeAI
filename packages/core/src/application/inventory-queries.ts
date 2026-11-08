import { matchCategoryByName, fallbackCategory } from '../catalog/match';
import { CONTRACT_V1 } from '../contract/operations';
import { daysBetween, toLocalDate } from '../dates';
import { expiryStatus, RESERVE_SOON_THRESHOLD_DAYS, soonThresholdFor } from '../expiry';
import type { Id } from '../ids';
import { summarizeImpact } from '../metrics';
import type { InventoryItem, Product } from '../model/inventory';
import type { InventoryItemView } from '../contract/operations';
import type { AppContext, UseCase } from './command';
import { factsOf, retailersOfItems, toView } from './inventory-shared';

/**
 * The inventory queries of contract v1 (ADR-0005), ADR-0034 layer 2: the household's stock,
 * what expires soon, history, product lookup and waste statistics. Read-only, via the ports.
 */
export function createInventoryQueries(ctx: AppContext) {
  const { storage, clock, catalog } = ctx;

  async function householdProducts(householdId: Id): Promise<Map<Id, Product>> {
    const products = await storage.products.ofHousehold(householdId);
    return new Map(products.map((product) => [product.id, product]));
  }

  async function activeViews(householdId: Id): Promise<InventoryItemView[]> {
    const [items, products] = await Promise.all([
      storage.items.activeOf(householdId),
      householdProducts(householdId),
    ]);
    const live = items
      .filter((item) => item.deletedAt === undefined)
      .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));
    const retailers = await retailersOfItems(storage, householdId, live);
    return live.map((item) => toView(item, products.get(item.productId), retailers.get(item.id)));
  }

  const list: UseCase<'inventory.list'> = async (raw) => {
    const input = CONTRACT_V1['inventory.list'].input.parse(raw);
    const views = await activeViews(input.householdId);
    return {
      items:
        input.location === undefined
          ? views
          : views.filter((view) => view.location === input.location),
    };
  };

  const listExpiring: UseCase<'inventory.listExpiring'> = async (raw) => {
    const input = CONTRACT_V1['inventory.listExpiring'].input.parse(raw);
    const today = clock.today();
    const items = (await activeViews(input.householdId))
      .filter((view) => {
        const daysLeft = daysBetween(today, view.expiresOn);
        if (view.location !== 'reserve') {
          return daysLeft <= input.withinDays;
        }
        // The Notvorrat only shows up when it needs attention (or when asked for explicitly).
        return input.includeReserve
          ? daysLeft <= input.withinDays
          : daysLeft <= RESERVE_SOON_THRESHOLD_DAYS;
      })
      .map((view) => ({
        ...view,
        status: expiryStatus(
          view.expiresOn,
          today,
          view.expiryKind,
          soonThresholdFor(view.location),
        ),
      }));
    return { items };
  };

  const lookupProduct: UseCase<'products.lookup'> = async (raw) => {
    const input = CONTRACT_V1['products.lookup'].input.parse(raw);
    // The household's own product wins: it carries the name and category the person chose.
    const own = (await storage.products.ofHousehold(input.householdId)).find(
      (product) => product.deletedAt === undefined && product.gtin === input.gtin,
    );
    if (own !== undefined) {
      return {
        product: {
          name: own.name,
          categoryId: own.categoryId,
          source: 'household',
          ...factsOf(own),
          ...(own.source === 'off' ? { factsFrom: 'off' as const } : {}),
        },
      };
    }
    const found = await catalog?.lookupByGtin(input.gtin);
    if (found === undefined || found === null) {
      return { product: null };
    }
    const category =
      matchCategoryByName(found.name) ??
      matchCategoryByName((found.categoryHints ?? []).join(' ')) ??
      fallbackCategory();
    return {
      product: {
        name: found.name,
        categoryId: category.id,
        source: found.source,
        ...factsOf(found),
      },
    };
  };

  const productImage: UseCase<'products.image'> = async (raw) => {
    const input = CONTRACT_V1['products.image'].input.parse(raw);
    const entry = await storage.productImages.get(input.gtin);
    return { image: entry === undefined ? null : { dataUrl: entry.dataUrl, source: entry.source } };
  };

  /** At most this many entries: enough for a year of a household, small enough for a phone. */
  const HISTORY_LIMIT = 500;

  const history: UseCase<'inventory.history'> = async (raw) => {
    const input = CONTRACT_V1['inventory.history'].input.parse(raw);
    const outcomes = (await storage.outcomes.ofHousehold(input.householdId))
      .filter((outcome) => {
        const day = toLocalDate(outcome.at);
        return outcome.deletedAt === undefined && day >= input.from && day <= input.to;
      })
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, HISTORY_LIMIT);
    const items = new Map<Id, InventoryItem>();
    for (const itemId of new Set(outcomes.map((outcome) => outcome.itemId))) {
      const item = await storage.items.get(itemId);
      if (item !== undefined) {
        items.set(item.id, item);
      }
    }
    const products = new Map<Id, Product>();
    for (const productId of new Set([...items.values()].map((item) => item.productId))) {
      const product = await storage.products.get(productId);
      if (product !== undefined) {
        products.set(product.id, product);
      }
    }
    return {
      outcomes: outcomes.flatMap((outcome) => {
        const item = items.get(outcome.itemId);
        const name = item === undefined ? undefined : products.get(item.productId)?.name;
        return item === undefined || name === undefined
          ? []
          : [
              {
                eventId: outcome.id,
                itemId: item.id,
                name,
                outcome: outcome.outcome,
                quantity: outcome.quantity,
                unit: item.unit,
                valueRappen: outcome.valueRappen,
                valueEstimated: outcome.valueEstimated,
                ...(outcome.wasteReason === undefined ? {} : { wasteReason: outcome.wasteReason }),
                ...(outcome.sharedWith === undefined ? {} : { sharedWith: outcome.sharedWith }),
                at: outcome.at,
              },
            ];
      }),
    };
  };

  const wasteStats: UseCase<'stats.waste'> = async (raw) => {
    const input = CONTRACT_V1['stats.waste'].input.parse(raw);
    const outcomes = await storage.outcomes.ofHousehold(input.householdId);
    const summary = summarizeImpact(outcomes, input.from, input.to);
    return {
      savedRappen: summary.savedRappen,
      wastedRappen: summary.wastedRappen,
      savedGrams: summary.savedGrams,
      wastedGrams: summary.wastedGrams,
      savedCount: summary.savedCount,
      wastedCount: summary.wastedCount,
      usedRappen: summary.usedRappen,
      usedCount: summary.usedCount,
      estimated: summary.estimated,
    };
  };

  return {
    'inventory.list': list,
    'inventory.listExpiring': listExpiring,
    'inventory.history': history,
    'products.lookup': lookupProduct,
    'products.image': productImage,
    'stats.waste': wasteStats,
  };
}
