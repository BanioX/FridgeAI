import type {
  DomainEvent,
  Gtin,
  Household,
  InventoryItem,
  Member,
  OutcomeEvent,
  Product,
  ProductInfo,
  ReminderPrefs,
} from '@fridgeai/core';
import Dexie, { type EntityTable } from 'dexie';

/** Result of a command already executed, so repeating the same commandId is harmless. */
export interface ProcessedCommand {
  commandId: string;
  operation: string;
  result: unknown;
  at: string;
}

/**
 * Product data an open database returned for a barcode (step 10b). Device-local, not household
 * data: never synced, refreshed after a while, and only ever holds public product facts.
 */
export interface CatalogCacheEntry {
  gtin: Gtin;
  info: ProductInfo;
  fetchedAt: string;
}

export interface MetaEntry {
  key: 'currentHouseholdId' | 'currentMemberId';
  value: string;
}

/**
 * Local-first storage in IndexedDB (ADR-0003). Every synced row has householdId, updatedAt and
 * deletedAt; queries must ignore soft-deleted rows. New tables arrive with later steps as new
 * Dexie versions, never by changing version 1.
 */
export class FridgeDb extends Dexie {
  households!: EntityTable<Household, 'id'>;
  members!: EntityTable<Member, 'id'>;
  products!: EntityTable<Product, 'id'>;
  items!: EntityTable<InventoryItem, 'id'>;
  outcomes!: EntityTable<OutcomeEvent, 'id'>;
  reminderPrefs!: EntityTable<ReminderPrefs, 'id'>;
  events!: EntityTable<DomainEvent, 'id'>;
  commands!: EntityTable<ProcessedCommand, 'commandId'>;
  meta!: EntityTable<MetaEntry, 'key'>;
  catalogCache!: EntityTable<CatalogCacheEntry, 'gtin'>;

  constructor(name = 'fridgeai') {
    super(name);
    this.version(1).stores({
      households: 'id',
      members: 'id, householdId',
      products: 'id, householdId, gtin',
      items: 'id, householdId, [householdId+status], productId, expiresOn',
      outcomes: 'id, householdId, itemId, at',
      reminderPrefs: 'id, householdId, memberId',
      events: 'id, householdId, type, at',
      commands: 'commandId',
      meta: 'key',
    });
    this.version(2).stores({ catalogCache: 'gtin, fetchedAt' });
  }
}
