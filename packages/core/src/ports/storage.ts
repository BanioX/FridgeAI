/**
 * Storage ports (ADR-0034): how the application layer reads and writes household data without
 * knowing the database. The browser implements them with Dexie (IndexedDB), a later server with
 * PostgreSQL, tests with `createMemoryStorage`.
 */
import type { DomainEvent } from '../contract/events';
import type { OperationName } from '../contract/operations';
import type { Id } from '../ids';
import type { Gtin } from '../model/primitives';
import type { ProductInfo } from './index';
import type { Household, Member, ReminderPrefs } from '../model/household';
import type { InventoryItem, OutcomeEvent, Product, ShoppingListItem } from '../model/inventory';
import type { Receipt, ReceiptLine } from '../model/receipt';
import type { OwnRecipe } from '../recipes/own-recipe';
import type { IsoDateTime } from '../model/primitives';

/** One kind of household record (a table). Soft-deleted rows are returned; callers filter them. */
export interface RecordStore<TRecord extends { id: Id; householdId: Id }> {
  get: (id: Id) => Promise<TRecord | undefined>;
  /** Every row of one household, in no particular order. */
  ofHousehold: (householdId: Id) => Promise<TRecord[]>;
  /** Inserts a new row; fails if the id exists. */
  add: (record: TRecord) => Promise<void>;
  /** Inserts or replaces a row. */
  put: (record: TRecord) => Promise<void>;
}

export interface InventoryStore extends RecordStore<InventoryItem> {
  /** Items still at home (status «active»), soft-deleted ones included. */
  activeOf: (householdId: Id) => Promise<InventoryItem[]>;
}

export interface OutcomeStore extends RecordStore<OutcomeEvent> {
  ofItem: (itemId: Id) => Promise<OutcomeEvent[]>;
}

export interface HouseholdStore {
  get: (id: Id) => Promise<Household | undefined>;
  add: (household: Household) => Promise<void>;
}

/** Results of commands already executed: a repeated commandId returns the stored result. */
export interface CommandLog {
  find: (commandId: Id) => Promise<{ result: unknown } | undefined>;
  record: (entry: {
    commandId: Id;
    operation: OperationName;
    result: unknown;
    at: IsoDateTime;
  }) => Promise<void>;
}

export interface EventLog {
  append: (event: DomainEvent) => Promise<void>;
  ofHousehold: (householdId: Id) => Promise<DomainEvent[]>;
}

/** What this device remembers about public barcodes. Read-only here: the data layer fills it. */
export interface DeviceCaches {
  /** Facts an open product database gave for a barcode. */
  productFacts: { get: (gtin: Gtin) => Promise<ProductInfo | undefined> };
  /** A pack picture as data URL. */
  productImages: {
    get: (gtin: Gtin) => Promise<{ dataUrl: string; source: 'off' } | undefined>;
  };
}

export interface Storage extends DeviceCaches {
  households: HouseholdStore;
  members: RecordStore<Member>;
  reminderPrefs: RecordStore<ReminderPrefs>;
  products: RecordStore<Product>;
  items: InventoryStore;
  outcomes: OutcomeStore;
  shoppingItems: RecordStore<ShoppingListItem>;
  receipts: RecordStore<Receipt>;
  receiptLines: RecordStore<ReceiptLine>;
  /** «Meine Rezepte» (ADR-0048). */
  ownRecipes: RecordStore<OwnRecipe>;
  events: EventLog;
  commands: CommandLog;
  /**
   * Runs `work` atomically: all its writes happen or none. Only storage calls may be awaited
   * inside (no network), because IndexedDB ends a transaction at the first foreign await.
   */
  transaction: <T>(work: () => Promise<T>) => Promise<T>;
}
