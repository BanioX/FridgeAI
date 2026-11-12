import { describe, expect, it } from 'vitest';
import { DomainEventSchema } from '../src/contract/events';
import { CONTRACT_V1, contractJsonSchemas, OPERATION_NAMES } from '../src/contract/operations';
import { uuidV7 } from '../src/ids';
import { ScopeSchema } from '../src/model';

const id = (n: number) => uuidV7(1_762_441_200_000 + n, new Uint8Array(10).fill(n));
const householdId = id(1);

describe('contract v1', () => {
  it('keeps a stable list of operations (removing or renaming one is a breaking change)', () => {
    expect(OPERATION_NAMES).toEqual([
      'inventory.list',
      'inventory.listExpiring',
      'inventory.addItem',
      'inventory.updateItem',
      'inventory.deleteItem',
      'inventory.recategorize',
      'inventory.restoreItem',
      'inventory.recordOutcome',
      'inventory.undoOutcome',
      'inventory.changeOutcome',
      'inventory.history',
      'inventory.open',
      'inventory.move',
      'inventory.process',
      'inventory.completeCheck',
      'products.setNutrition',
      'products.lookup',
      'products.search',
      'products.frequent',
      'products.wasteHabits',
      'products.image',
      'products.setSpot',
      'products.setMinStock',
      'spots.list',
      'spots.create',
      'spots.update',
      'spots.delete',
      'shopping.list',
      'shopping.addItem',
      'shopping.check',
      'shopping.remove',
      'recipes.suggest',
      'recipes.list',
      'recipes.withItems',
      'recipes.get',
      'recipes.create',
      'recipes.update',
      'recipes.delete',
      'stats.waste',
      'stats.impact',
      'stats.footprint',
      'stats.achievements',
      'prices.memory',
      'reports.build',
      'rescue.offer',
      'receipts.import',
      'receipts.matchLine',
      'products.fromLabel',
      'receipts.known',
      'household.members',
      'household.addMember',
      'household.renameMember',
      'household.removeMember',
      'household.export',
      'household.import',
      'household.delete',
    ]);
  });

  it('names, kinds and scopes are consistent', () => {
    for (const name of OPERATION_NAMES) {
      const operation = CONTRACT_V1[name];
      expect(operation.name).toBe(name);
      expect(name).toMatch(/^[a-z]+\.[a-zA-Z]+$/);
      expect(operation.scopes.length).toBeGreaterThan(0);
      for (const scope of operation.scopes) {
        expect(ScopeSchema.safeParse(scope).success).toBe(true);
      }
      const needsWrite = operation.scopes.some((scope) => scope.endsWith(':write'));
      expect(needsWrite).toBe(operation.kind === 'command');
      expect(operation.summary.de.length).toBeGreaterThan(10);
      expect(operation.summary.en.length).toBeGreaterThan(10);
    }
  });

  it('makes every command idempotent with a commandId', () => {
    const commandId = id(2);
    for (const name of OPERATION_NAMES) {
      const schemas = contractJsonSchemas().find((entry) => entry.name === name);
      const required = (schemas?.input as { required?: string[] }).required ?? [];
      expect(required).toContain('householdId');
      expect(required.includes('commandId')).toBe(CONTRACT_V1[name].kind === 'command');
    }
    const parsed = CONTRACT_V1['inventory.addItem'].input.parse({
      commandId,
      householdId,
      name: 'Vollmilch',
      location: 'fridge',
    });
    expect(parsed).toMatchObject({ quantity: 1, unit: 'pcs', owner: 'shared' });
  });

  it('exports JSON Schema for every operation (basis for OpenAPI and MCP tools)', () => {
    const schemas = contractJsonSchemas();
    expect(schemas).toHaveLength(OPERATION_NAMES.length);
    for (const schema of schemas) {
      expect(schema.input).toMatchObject({ type: 'object' });
      expect(schema.output).toMatchObject({ type: 'object' });
      expect(JSON.parse(JSON.stringify(schema))).toEqual(schema);
    }
    const expiring = schemas.find((schema) => schema.name === 'inventory.listExpiring');
    expect(JSON.stringify(expiring?.input)).toContain('withinDays');
  });

  it('rejects invalid input', () => {
    expect(
      CONTRACT_V1['inventory.listExpiring'].input.safeParse({ householdId, withinDays: -1 })
        .success,
    ).toBe(false);
    expect(
      CONTRACT_V1['inventory.addItem'].input.safeParse({
        householdId,
        name: 'x',
        location: 'fridge',
      }).success,
    ).toBe(false);
  });
});

describe('domain events v1', () => {
  const base = { id: id(3), version: 1, householdId, actor: id(4), at: '2026-11-06T16:00:00.000Z' };

  it('parses known events', () => {
    const event = DomainEventSchema.parse({
      ...base,
      type: 'item.used_up',
      payload: { itemId: id(5), productId: id(6), gtin: '4006381333931' },
    });
    expect(event.type).toBe('item.used_up');
    expect(
      DomainEventSchema.safeParse({
        ...base,
        actor: 'system',
        type: 'item.expiring_soon',
        payload: { itemId: id(5), expiresOn: '2026-11-07', daysLeft: 1, kind: 'use_by' },
      }).success,
    ).toBe(true);
  });

  it('rejects unknown types, other versions and wrong payloads', () => {
    expect(
      DomainEventSchema.safeParse({ ...base, type: 'item.teleported', payload: {} }).success,
    ).toBe(false);
    expect(
      DomainEventSchema.safeParse({
        ...base,
        version: 2,
        type: 'shopping_list.item_checked',
        payload: { shoppingItemId: id(7) },
      }).success,
    ).toBe(false);
    expect(
      DomainEventSchema.safeParse({ ...base, type: 'item.moved', payload: { itemId: id(5) } })
        .success,
    ).toBe(false);
  });
});
