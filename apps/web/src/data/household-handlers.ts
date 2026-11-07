import { CONTRACT_V1 } from '@fridgeai/core';
import { CommandError, type Handler, type HandlerContext } from './command';

/**
 * Data portability and deletion on the device (ADR-0020, plan 12a). Export hands out everything
 * of the household, deleted rows included: it is the person's data. Deleting clears every table,
 * caches included; the next start creates a fresh local household. With accounts (step 7) the
 * server answers the same two operations.
 */
export function createHouseholdHandlers(ctx: HandlerContext) {
  const { db, clock } = ctx;

  const exportAll: Handler<'household.export'> = async (raw) => {
    const input = CONTRACT_V1['household.export'].input.parse(raw);
    return db.transaction('r', db.tables, async () => {
      const household = await db.households.get(input.householdId);
      if (household === undefined) {
        throw new CommandError('not_found', `Household ${input.householdId} not found`);
      }
      const id = input.householdId;
      const [members, products, items, outcomes, shoppingItems, receipts, receiptLines, events] =
        await Promise.all([
          db.members.where('householdId').equals(id).toArray(),
          db.products.where('householdId').equals(id).toArray(),
          db.items.where('householdId').equals(id).toArray(),
          db.outcomes.where('householdId').equals(id).toArray(),
          db.shoppingItems.where('householdId').equals(id).toArray(),
          db.receipts.where('householdId').equals(id).toArray(),
          db.receiptLines.where('householdId').equals(id).toArray(),
          db.events.where('householdId').equals(id).toArray(),
        ]);
      return CONTRACT_V1['household.export'].output.parse({
        format: 'fridgeai-export',
        contractVersion: 'v1',
        exportedAt: clock.now(),
        household,
        members,
        products,
        items,
        outcomes,
        shoppingItems,
        receipts,
        receiptLines,
        events,
      });
    });
  };

  const deleteAll: Handler<'household.delete'> = async (raw) => {
    CONTRACT_V1['household.delete'].input.parse(raw);
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
    });
    return { deleted: true };
  };

  return { 'household.export': exportAll, 'household.delete': deleteAll };
}

export type HouseholdHandlers = ReturnType<typeof createHouseholdHandlers>;
