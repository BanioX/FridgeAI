import type { AppContext } from './command';
import { createInventoryCommands } from './inventory-commands';
import { createInsightQueries } from './insights';
import { createInventoryQueries } from './inventory-queries';

/**
 * All inventory operations of contract v1 (ADR-0034, layer 2): stock, outcomes, product lookup,
 * waste statistics, usual products, price memory and the report. Talks to data only through
 * `ctx.storage` and the other ports.
 */
export function createInventoryUseCases(ctx: AppContext) {
  return {
    ...createInventoryQueries(ctx),
    ...createInventoryCommands(ctx),
    ...createInsightQueries(ctx),
  };
}

export type InventoryUseCases = ReturnType<typeof createInventoryUseCases>;
