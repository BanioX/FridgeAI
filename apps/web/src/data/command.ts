import {
  createCommandKit as createCoreCommandKit,
  type AppContext,
  type Clock,
  type Id,
  type IdGenerator,
  type OperationName,
  type ProductCatalog,
  type ProductSearch,
  type UseCase,
} from '@fridgeai/core';
import type { FridgeDb } from './db';
import { dexieStorage } from './dexie-storage';

export interface HandlerContext {
  db: FridgeDb;
  clock: Clock;
  ids: IdGenerator;
  /** The member acting (author of events and outcomes). */
  actor: Id;
  /** Open product databases for unknown barcodes (Open Food Facts); none = household only. */
  catalog?: ProductCatalog;
  /** Name search in open databases; none = household only. */
  search?: ProductSearch;
}

export type Handler<TName extends OperationName> = UseCase<TName>;

export { CommandError, type CommandErrorCode } from '@fridgeai/core';

/** The use-case context on this device: the storage ports on IndexedDB (ADR-0034). */
export function appContext(ctx: HandlerContext): AppContext {
  return { ...ctx, storage: dexieStorage(ctx.db) };
}

/**
 * Commands not yet moved to `packages/core/src/application` use the core command kit on Dexie:
 * one transaction, idempotency by commandId and domain events (ADR-0005).
 */
export function createCommandKit(ctx: HandlerContext) {
  return createCoreCommandKit(appContext(ctx));
}
