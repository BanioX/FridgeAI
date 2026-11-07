import { createInventoryUseCases, createReceiptMatchUseCases } from '@fridgeai/core';
import type { HandlerContext } from './command';
import { createProductSearchHandler } from './product-search-handler';
import { createReceiptHandlers } from './receipt-handlers';
import { appContext as webAppContext } from './command';

export { CommandError, type CommandErrorCode, type HandlerContext } from './command';

/**
 * The inventory operations of contract v1 on this device (ADR-0034): the use cases live in
 * `packages/core/src/application` and run on the Dexie storage; the sub-handlers not yet moved
 * (product search, receipt import) are added here.
 */
export function createInventoryHandlers(ctx: HandlerContext) {
  const app = webAppContext(ctx);
  const inventory = createInventoryUseCases(app);
  return {
    ...inventory,
    ...createProductSearchHandler(ctx),
    ...createReceiptHandlers(ctx, inventory['inventory.addItem']),
    ...createReceiptMatchUseCases(app),
  };
}

export type InventoryHandlers = ReturnType<typeof createInventoryHandlers>;
