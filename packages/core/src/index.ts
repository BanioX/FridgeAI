/**
 * @fridgeai/core – pure domain logic for FridgeAI.
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
export * from './ids';
export * from './model';
export * from './money';
export * from './scan/gs1';
export * from './ports';
export * from './ports/mocks';
export * from './contract/events';
export * from './contract/operations';
export * from './scan/label';
export * from './catalog/match';
export * from './value';
export * from './quantity';
export * from './import/ai-import';
export * from './catalog/open-food-facts';
