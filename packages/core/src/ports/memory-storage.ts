import type { Gtin } from '../model/primitives';
import type { ProductInfo } from './index';
import type { DomainEvent } from '../contract/events';
import type { Id } from '../ids';
import type { Household } from '../model/household';
import type { InventoryItem, OutcomeEvent } from '../model/inventory';
import type {
  CommandLog,
  EventLog,
  HouseholdStore,
  InventoryStore,
  OutcomeStore,
  RecordStore,
  Storage,
} from './storage';

interface Row {
  id: Id;
  householdId: Id;
}

/**
 * Storage in plain memory, for tests of the application layer and as the reference behaviour of
 * the storage ports. Rows are copied in and out, so callers cannot change stored data by accident;
 * a failing transaction restores every table.
 */
export function createMemoryStorage(
  caches: {
    productFacts?: Partial<Record<Gtin, ProductInfo>>;
    productImages?: Partial<Record<Gtin, string>>;
  } = {},
): Storage {
  const tables: Map<string, unknown>[] = [];
  const table = <TValue>() => {
    const map = new Map<string, TValue>();
    tables.push(map);
    return map;
  };

  function recordStore<TRecord extends Row>(rows = table<TRecord>()): RecordStore<TRecord> {
    return {
      get: (id) => Promise.resolve(copy(rows.get(id))),
      ofHousehold: (householdId) =>
        Promise.resolve(
          [...rows.values()]
            .filter((row) => row.householdId === householdId)
            .map((row) => ({ ...row })),
        ),
      add: (record) => {
        if (rows.has(record.id)) {
          return Promise.reject(new Error(`Row ${record.id} exists`));
        }
        rows.set(record.id, { ...record });
        return Promise.resolve();
      },
      put: (record) => {
        rows.set(record.id, { ...record });
        return Promise.resolve();
      },
    };
  }

  const itemRows = table<InventoryItem>();
  const itemStore = recordStore(itemRows);
  const items: InventoryStore = {
    ...itemStore,
    activeOf: async (householdId) =>
      (await itemStore.ofHousehold(householdId)).filter((item) => item.status === 'active'),
  };

  const outcomeRows = table<OutcomeEvent>();
  const outcomes: OutcomeStore = {
    ...recordStore(outcomeRows),
    ofItem: (itemId) =>
      Promise.resolve(
        [...outcomeRows.values()].filter((row) => row.itemId === itemId).map((row) => ({ ...row })),
      ),
  };

  const householdRows = table<Household>();
  const households: HouseholdStore = {
    get: (id) => Promise.resolve(copy(householdRows.get(id))),
    add: (household) => {
      householdRows.set(household.id, { ...household });
      return Promise.resolve();
    },
  };

  const eventRows = table<DomainEvent>();
  const events: EventLog = {
    append: (event) => {
      eventRows.set(event.id, event);
      return Promise.resolve();
    },
    ofHousehold: (householdId) =>
      Promise.resolve([...eventRows.values()].filter((event) => event.householdId === householdId)),
  };

  const commandRows = table<{ result: unknown }>();
  const commands: CommandLog = {
    find: (commandId) => Promise.resolve(commandRows.get(commandId)),
    record: ({ commandId, result }) => {
      commandRows.set(commandId, { result });
      return Promise.resolve();
    },
  };

  let depth = 0;
  async function transaction<T>(work: () => Promise<T>): Promise<T> {
    if (depth > 0) {
      return work();
    }
    const snapshot = tables.map((rows) => new Map(rows));
    depth += 1;
    try {
      return await work();
    } catch (error) {
      tables.forEach((rows, index) => {
        rows.clear();
        snapshot[index]?.forEach((value, key) => rows.set(key, value));
      });
      throw error;
    } finally {
      depth -= 1;
    }
  }

  return {
    households,
    members: recordStore(),
    reminderPrefs: recordStore(),
    products: recordStore(),
    items,
    outcomes,
    shoppingItems: recordStore(),
    receipts: recordStore(),
    receiptLines: recordStore(),
    ownRecipes: recordStore(),
    spots: recordStore(),
    feedback: recordStore(),
    events,
    commands,
    productFacts: {
      get: (gtin) => Promise.resolve(caches.productFacts?.[gtin]),
    },
    productImages: {
      get: (gtin) => {
        const dataUrl = caches.productImages?.[gtin];
        return Promise.resolve(dataUrl === undefined ? undefined : { dataUrl, source: 'off' });
      },
    },
    transaction,
  };
}

function copy<TValue extends object>(value: TValue | undefined): TValue | undefined {
  return value === undefined ? undefined : { ...value };
}
