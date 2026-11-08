import { normalizeFoodText } from '../catalog/match';
import { CONTRACT_V1, type OperationOutput } from '../contract/operations';
import type { Id } from '../ids';
import type { ProductSearch, ProductSearchHit } from '../ports';
import { rankReceiptHits, receiptSearchPlan } from '../receipt/off-match';
import type { AppContext, UseCase } from './command';

type Match = NonNullable<OperationOutput<'receipts.matchLine'>['match']>;

/**
 * `receipts.matchLine` (Alban, 7.11.2026: one tap per receipt). First what the household learned:
 * an earlier receipt line with the same printed name that went into the inventory as a product
 * with a barcode, no network needed. Then the catalog shipped with the app, on the device
 * (ADR-0045). Only when that has no sure hit, Open Food Facts with the cleaned product words.
 */
export function createReceiptMatchUseCases({ storage, search, localSearch }: AppContext) {
  /** The query, then the fallback without the house brand when the query finds nothing. */
  async function hitsFor(
    source: ProductSearch,
    plan: NonNullable<ReturnType<typeof receiptSearchPlan>>,
  ): Promise<ProductSearchHit[] | 'unavailable'> {
    const hits = await source.searchByName(plan.query, 8);
    return hits !== 'unavailable' && hits.length === 0 && plan.fallback !== undefined
      ? source.searchByName(plan.fallback, 8)
      : hits;
  }

  async function learned(householdId: Id, name: string): Promise<Match | undefined> {
    const printed = normalizeFoodText(name);
    const lines = (await storage.receiptLines.ofHousehold(householdId)).filter(
      (line) =>
        line.deletedAt === undefined &&
        line.includedInInventory &&
        normalizeFoodText(line.name) === printed,
    );
    if (lines.length === 0) {
      return undefined;
    }
    const lineIds = new Set(lines.map((line) => line.id));
    const items = (await storage.items.ofHousehold(householdId))
      .filter((item) => item.receiptLineId !== undefined && lineIds.has(item.receiptLineId))
      .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
    for (const item of items) {
      const product = await storage.products.get(item.productId);
      if (product?.gtin !== undefined && product.deletedAt === undefined) {
        return {
          gtin: product.gtin,
          name: product.name,
          ...(product.brand === undefined ? {} : { brand: product.brand }),
          ...(product.packSize === undefined ? {} : { packSize: product.packSize }),
          source: 'household',
          confidence: 'sure',
        };
      }
    }
    return undefined;
  }

  const matchLine: UseCase<'receipts.matchLine'> = async (raw) => {
    const input = CONTRACT_V1['receipts.matchLine'].input.parse(raw);
    const known = await learned(input.householdId, input.name);
    if (known !== undefined) {
      return { match: known, openDatabase: 'none' };
    }
    const plan = receiptSearchPlan(input.name);
    if (plan === null) {
      return { openDatabase: 'none' };
    }
    const shipped = localSearch === undefined ? 'unavailable' : await hitsFor(localSearch, plan);
    const local = shipped === 'unavailable' ? null : rankReceiptHits(input.name, shipped);
    const fromCatalog =
      local === null
        ? undefined
        : ({ ...local.hit, source: 'catalog', confidence: local.confidence } satisfies Match);
    // A sure hit on the device: no product name has to leave it.
    if (fromCatalog?.confidence === 'sure' || search === undefined) {
      return { ...(fromCatalog === undefined ? {} : { match: fromCatalog }), openDatabase: 'none' };
    }
    const hits = await hitsFor(search, plan);
    const best = hits === 'unavailable' ? null : rankReceiptHits(input.name, hits);
    const openDatabase = hits === 'unavailable' ? 'unavailable' : 'searched';
    if (best !== null) {
      return {
        match: { ...best.hit, source: 'off', confidence: best.confidence },
        openDatabase,
      };
    }
    return { ...(fromCatalog === undefined ? {} : { match: fromCatalog }), openDatabase };
  };

  return { 'receipts.matchLine': matchLine };
}

export type ReceiptMatchUseCases = ReturnType<typeof createReceiptMatchUseCases>;
