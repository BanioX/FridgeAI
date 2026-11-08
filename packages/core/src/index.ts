/**
 * @fridgeai/core – pure domain logic for rettich.
 *
 * Rules (see CLAUDE.md): no DOM, no IndexedDB, no fetch. Everything external goes through ports.
 * The tsconfig enforces this by compiling src without DOM and Node type definitions.
 */
export const CONTRACT_VERSION = 'v1' as const;

export type ContractVersion = typeof CONTRACT_VERSION;

export * from './catalog/categories';
export * from './catalog/category';
export * from './dates';
export * from './expiry';
export * from './export/csv';
export * from './format';
export * from './ids';
export * from './model';
export * from './money';
export * from './currency';
export * from './scan/gs1';
export * from './ports';
export * from './ports/mocks';
export * from './ports/storage';
export * from './ports/memory-storage';
export * from './application';
export * from './contract/events';
export * from './contract/operations';
export * from './scan/label';
export * from './catalog/match';
export * from './catalog/perishability';
export * from './catalog/receipt-words';
export * from './value';
export * from './quantity';
export * from './import/ai-import';
export * from './catalog/open-food-facts';
export * from './metrics';
export * from './frequent-products';
export * from './recipes/recipe';
export * from './recipes/recipes.de-CH';
export * from './receipt/parse-receipt';
export * from './nutrition/label';
export * from './receipt/pdf-lines';
export * from './receipt/off-match';
export * from './prices/price-memory';
export * from './reports/closing';
export * from './reports/report';
