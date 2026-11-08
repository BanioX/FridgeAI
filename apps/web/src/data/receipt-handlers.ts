import {
  CONTRACT_V1,
  matchCategoryByName,
  ReceiptLineSchema,
  ReceiptSchema,
  rappen,
  type Id,
} from '@fridgeai/core';
import { createCommandKit, type Handler, type HandlerContext } from './command';

/**
 * `receipts.import` (ADR-0028): stores a reviewed receipt with its lines (name, quantity, price,
 * discount) and puts the chosen items into the inventory with the price actually paid. The same
 * receipt (same hash) is never imported twice. The picture, PDF and raw text are not stored.
 */
export function createReceiptHandlers(ctx: HandlerContext, addItem: Handler<'inventory.addItem'>) {
  const { db, clock, ids, actor } = ctx;
  const { event, runCommand } = createCommandKit(ctx);

  const importReceipt: Handler<'receipts.import'> = async (raw) => {
    const input = CONTRACT_V1['receipts.import'].input.parse(raw);
    const { householdId } = input;
    return runCommand('receipts.import', input.commandId, async () => {
      const known = await db.receipts
        .where('householdId')
        .equals(householdId)
        .filter((receipt) => receipt.hash === input.hash && receipt.deletedAt === undefined)
        .first();
      if (known !== undefined) {
        return { receiptId: known.id, itemIds: [], duplicate: true };
      }
      const now = clock.now();
      const receiptId = ids.next();
      await db.receipts.add(
        ReceiptSchema.parse({
          id: receiptId,
          householdId,
          updatedAt: now,
          retailer: input.retailer,
          ...(input.storeName === undefined ? {} : { storeName: input.storeName }),
          purchasedAt: input.purchasedAt,
          totalRappen: input.totalRappen,
          source: input.source,
          hash: input.hash,
          createdBy: actor,
        }),
      );
      const itemIds: Id[] = [];
      for (const [position, line] of input.lines.entries()) {
        const lineId = ids.next();
        const toInventory = line.kind === 'item' && line.location !== undefined;
        const category = matchCategoryByName(line.name);
        await db.receiptLines.add(
          ReceiptLineSchema.parse({
            id: lineId,
            householdId,
            updatedAt: now,
            receiptId,
            position,
            rawText: line.name,
            name: line.name,
            kind: line.kind,
            isFood: line.isFood,
            quantity: line.quantity,
            unit: line.unit,
            ...(line.unitPriceRappen === undefined
              ? {}
              : { unitPriceRappen: line.unitPriceRappen }),
            ...(line.unit === 'g' ? { weightGrams: Math.max(1, Math.round(line.quantity)) } : {}),
            priceRappen: line.priceRappen,
            discountRappen: line.discountRappen,
            ...(category === null ? {} : { categoryId: category.id }),
            assignedTo: 'shared',
            includedInInventory: toInventory,
          }),
        );
        if (toInventory && line.location !== undefined) {
          const paid = Math.max(0, line.priceRappen + line.discountRappen);
          const { itemId } = await addItem({
            commandId: ids.next(),
            householdId,
            // A confirmed product (receipts.matchLine) names the item; the line keeps the print.
            name: line.productName ?? line.name,
            ...(line.gtin === undefined ? {} : { gtin: line.gtin }),
            location: line.location,
            ...(line.expiresOn === undefined
              ? {}
              : { expiresOn: line.expiresOn, expirySource: 'manual' as const }),
            quantity: line.quantity,
            unit: line.unit,
            priceRappen: rappen(paid),
          });
          await db.items.update(itemId, { receiptLineId: lineId });
          itemIds.push(itemId);
        }
      }
      await db.events.add(
        event(householdId, 'receipt.imported', {
          receiptId,
          retailer: input.retailer,
          lineCount: input.lines.length,
          totalRappen: input.totalRappen,
        }),
      );
      return { receiptId, itemIds, duplicate: false };
    });
  };

  return { 'receipts.import': importReceipt };
}
