import { CONTRACT_V1, createHouseholdUseCases, DomainEventSchema } from '@fridgeai/core';
import { defaultReminderPrefs } from './bootstrap';
import { appContext, CommandError, type Handler, type HandlerContext } from './command';

/**
 * Data portability and deletion on the device (ADR-0020, plan 12a). Export is a core use case
 * (`createHouseholdUseCases`). Deleting clears every table,
 * caches included; the next start creates a fresh local household. Import brings an export back,
 * e.g. on a new device or a new web address, and replaces what is there. With accounts (step 7)
 * the server answers the same operations.
 */
export function createHouseholdHandlers(ctx: HandlerContext) {
  const { db, clock, ids } = ctx;

  const deleteAll: Handler<'household.delete'> = async (raw) => {
    CONTRACT_V1['household.delete'].input.parse(raw);
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
    });
    return { deleted: true };
  };

  const importAll: Handler<'household.import'> = async (raw) => {
    const { commandId, data } = CONTRACT_V1['household.import'].input.parse(raw);
    return db.transaction('rw', db.tables, async () => {
      const done = await db.commands.get(commandId);
      if (done !== undefined) {
        return CONTRACT_V1['household.import'].output.parse(done.result);
      }
      // The person goes on as the owner of the imported household (or its first member).
      const member = data.members.find((entry) => entry.role === 'owner') ?? data.members[0];
      if (member === undefined) {
        throw new CommandError('not_found', 'The export has no member');
      }
      const now = clock.now();
      const imported = DomainEventSchema.parse({
        id: ids.next(),
        type: 'household.imported',
        version: 1,
        householdId: data.household.id,
        actor: member.id,
        at: now,
        payload: {
          exportedAt: data.exportedAt,
          itemCount: data.items.length,
          outcomeCount: data.outcomes.length,
        },
      });
      const result = {
        householdId: data.household.id,
        memberId: member.id,
        itemCount: data.items.length,
        outcomeCount: data.outcomes.length,
      };

      // Replace, never merge: two copies of the same household would count twice. Device caches
      // (product data and pictures) stay; they hold public facts only.
      const householdTables = db.tables.filter(
        (table) => table !== db.catalogCache && table !== db.productImages,
      );
      await Promise.all(householdTables.map((table) => table.clear()));
      await db.households.add(data.household);
      await db.members.bulkAdd(data.members);
      await db.reminderPrefs.add(defaultReminderPrefs(ids.next(), member, now));
      await db.products.bulkAdd(data.products);
      await db.items.bulkAdd(data.items);
      await db.outcomes.bulkAdd(data.outcomes);
      await db.shoppingItems.bulkAdd(data.shoppingItems);
      await db.receipts.bulkAdd(data.receipts);
      await db.receiptLines.bulkAdd(data.receiptLines);
      await db.ownRecipes.bulkAdd(data.ownRecipes);
      await db.events.bulkAdd([...data.events, imported]);
      await db.meta.bulkPut([
        { key: 'currentHouseholdId', value: data.household.id },
        { key: 'currentMemberId', value: member.id },
      ]);
      await db.commands.add({ commandId, operation: 'household.import', result, at: now });
      return result;
    });
  };

  return {
    ...createHouseholdUseCases(appContext(ctx)),
    'household.import': importAll,
    'household.delete': deleteAll,
  };
}

export type HouseholdHandlers = ReturnType<typeof createHouseholdHandlers>;
