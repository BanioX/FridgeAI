import 'fake-indexeddb/auto';
import { type Id, type OperationInput } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import { createInventoryHandlers } from './handlers';
import { createHouseholdHandlers } from './household-handlers';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

type ImportData = OperationInput<'household.import'>['data'];

describe('full export, delete and import round trip (ADR-0020)', () => {
  it('brings owners, members, made items and minimum stock back exactly', async () => {
    const db = testDb();
    const ids = sequentialIds();
    const clock = fixedClock('2026-11-12T09:00:00.000Z', '2026-11-12');
    const profile = await ensureLocalHousehold(db, clock, ids, { household: 'WG', member: 'Lena' });
    const householdId = profile.household.id;
    const ctx = { db, clock, ids, actor: profile.member.id };
    const inventory = createInventoryHandlers(ctx);
    const household = createHouseholdHandlers(ctx);
    const base = () => ({ commandId: ids.next(), householdId });

    // Two more members; one leaves again (leftAt), what they owned becomes shared (ADR-0058).
    const mia = (await household['household.addMember']({ ...base(), displayName: 'Mia' }))
      .memberId;
    const noah = (await household['household.addMember']({ ...base(), displayName: 'Noah' }))
      .memberId;
    await inventory['inventory.addItem']({
      ...base(),
      name: 'Hafermilch',
      location: 'fridge',
      owner: noah,
    });
    await household['household.removeMember']({ ...base(), memberId: noah });

    // An owned item, and an outcome that keeps the owner.
    const owned = await inventory['inventory.addItem']({
      ...base(),
      name: 'Joghurt',
      location: 'fridge',
      quantity: 2,
      owner: mia,
    });
    await inventory['inventory.recordOutcome']({
      ...base(),
      itemId: owned.itemId,
      outcome: 'eaten',
      quantity: 1,
    });

    // A processed cake with ingredients (madeInto, origin).
    const flour = await inventory['inventory.addItem']({
      ...base(),
      name: 'Mehl',
      location: 'pantry',
    });
    const eggs = await inventory['inventory.addItem']({
      ...base(),
      name: 'Eier',
      location: 'fridge',
    });
    await inventory['inventory.process']({
      ...base(),
      ingredients: [{ itemId: flour.itemId }, { itemId: eggs.itemId }],
      result: { name: 'Kuchen', kind: 'made', location: 'fridge' },
    });

    // A minimum stock that puts a row on the shopping list (minStock, source).
    const milk = await inventory['inventory.addItem']({
      ...base(),
      name: 'Vollmilch',
      location: 'fridge',
    });
    const milkProduct = (await db.items.get(milk.itemId))?.productId ?? ('' as Id);
    await inventory['products.setMinStock']({ ...base(), productId: milkProduct, minStock: 3 });
    await inventory['inventory.recordOutcome']({
      ...base(),
      itemId: milk.itemId,
      outcome: 'eaten',
    });

    const before = await household['household.export']({ householdId });
    // Guard the premise: every field under test is really present in the export.
    expect(before.members.find((member) => member.id === noah)?.leftAt).toBeDefined();
    expect(before.items.find((item) => item.id === owned.itemId)?.owner).toBe(mia);
    expect(before.outcomes.some((outcome) => outcome.owner === mia)).toBe(true);
    expect(before.items.some((item) => item.origin === 'made')).toBe(true);
    expect(before.outcomes.some((outcome) => outcome.madeInto !== undefined)).toBe(true);
    expect(before.products.find((product) => product.id === milkProduct)?.minStock).toBe(3);
    expect(before.shoppingItems.some((entry) => entry.source === 'min_stock')).toBe(true);

    const file = JSON.parse(JSON.stringify(before)) as ImportData;
    await household['household.delete']({ ...base(), confirm: true });
    expect(await db.items.count()).toBe(0);

    const fresh = await ensureLocalHousehold(db, clock, ids, { household: 'Neu', member: 'Ich' });
    await createHouseholdHandlers({ ...ctx, actor: fresh.member.id })['household.import']({
      commandId: ids.next(),
      householdId: fresh.household.id,
      data: file,
      confirm: true,
    });

    const after = await household['household.export']({ householdId });
    // Same data, field for field; only the export time and the new import event differ.
    expect({ ...after, events: [], exportedAt: before.exportedAt }).toEqual({
      ...before,
      events: [],
    });
    expect(after.events.length).toBe(before.events.length + 1);
  });
});
