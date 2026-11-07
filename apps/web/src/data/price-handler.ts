import {
  CONTRACT_V1,
  normalizeFoodText,
  rappen,
  summarizePrices,
  toLocalDate,
  type PriceObservation,
} from '@fridgeai/core';
import type { Handler, HandlerContext } from './command';

/**
 * `prices.memory` (ADR-0029): the household's own receipt prices per product, read on the device.
 * Products are matched by their name on the receipt, written the same way.
 */
export function createPriceHandler({ db, clock }: HandlerContext) {
  const memory: Handler<'prices.memory'> = async (raw) => {
    const input = CONTRACT_V1['prices.memory'].input.parse(raw);
    const [receipts, lines] = await Promise.all([
      db.receipts.where('householdId').equals(input.householdId).toArray(),
      db.receiptLines.where('householdId').equals(input.householdId).toArray(),
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
  return { 'prices.memory': memory };
}
