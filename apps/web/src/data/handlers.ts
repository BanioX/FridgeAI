import { createInventoryUseCases, createReceiptMatchUseCases } from '@fridgeai/core';
import type { HandlerContext } from './command';
import { createFrequentProductsHandler } from './frequent-handler';
import { createPriceHandler } from './price-handler';
import { createProductSearchHandler } from './product-search-handler';
import { createReceiptHandlers } from './receipt-handlers';
import { createReportHandler } from './report-handler';
import { appContext as webAppContext } from './command';

export { CommandError, type CommandErrorCode, type HandlerContext } from './command';

/**
 * The inventory operations of contract v1 on this device (ADR-0034): the use cases live in
 * `packages/core/src/application` and run on the Dexie storage; the sub-handlers not yet moved
 * (frequent products, search, receipt import, prices, report) are added here.
 */
export function createInventoryHandlers(ctx: HandlerContext) {
  const app = webAppContext(ctx);
  const inventory = createInventoryUseCases(app);
  return {
    ...inventory,
    ...createFrequentProductsHandler(ctx),
    ...createProductSearchHandler(ctx),
    ...createReceiptHandlers(ctx, inventory['inventory.addItem']),
    ...createReceiptMatchUseCases(app),
    ...createPriceHandler(ctx),
    ...createReportHandler(ctx),
  };
}

export type InventoryHandlers = ReturnType<typeof createInventoryHandlers>;
