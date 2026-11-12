import type { Id, InventoryStore, OutcomeStore, RecordStore, Storage } from '@fridgeai/core';
import type { EntityTable } from 'dexie';
import type { FridgeDb } from './db';

/**
 * The storage ports (ADR-0034) on IndexedDB. Rows are validated by the use cases before they get
 * here; this adapter only maps calls to Dexie tables and indexes.
 */
export function dexieStorage(db: FridgeDb): Storage {
  function recordStore<TRecord extends { id: Id; householdId: Id }>(
    table: EntityTable<TRecord, 'id'>,
  ): RecordStore<TRecord> {
    return {
      get: (id) => table.get(id),
      ofHousehold: (householdId) => table.where('householdId').equals(householdId).toArray(),
      add: async (record) => {
        await table.add(record);
      },
      put: async (record) => {
        await table.put(record);
      },
    };
  }

  const items: InventoryStore = {
    ...recordStore(db.items),
    activeOf: (householdId) =>
      db.items.where('[householdId+status]').equals([householdId, 'active']).toArray(),
  };

  const outcomes: OutcomeStore = {
    ...recordStore(db.outcomes),
    ofItem: (itemId) => db.outcomes.where('itemId').equals(itemId).toArray(),
  };

  return {
    households: {
      get: (id) => db.households.get(id),
      add: async (household) => {
        await db.households.add(household);
      },
    },
    members: recordStore(db.members),
    reminderPrefs: recordStore(db.reminderPrefs),
    products: recordStore(db.products),
    items,
    outcomes,
    shoppingItems: recordStore(db.shoppingItems),
    receipts: recordStore(db.receipts),
    receiptLines: recordStore(db.receiptLines),
    ownRecipes: recordStore(db.ownRecipes),
    spots: recordStore(db.spots),
    events: {
      append: async (event) => {
        await db.events.add(event);
      },
      ofHousehold: (householdId) => db.events.where('householdId').equals(householdId).toArray(),
    },
    commands: {
      find: (commandId) => db.commands.get(commandId),
      record: async (entry) => {
        await db.commands.add(entry);
      },
    },
    productFacts: { get: async (gtin) => (await db.catalogCache.get(gtin))?.info },
    productImages: { get: (gtin) => db.productImages.get(gtin) },
    // All tables: IndexedDB locks them only for the length of one short local command.
    transaction: (work) => db.transaction('rw', db.tables, work),
  };
}
