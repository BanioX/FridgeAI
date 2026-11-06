import { addDays, type Id, type OperationInput } from '@fridgeai/core';
import { browserClock, browserIds } from '../data/adapters';
import { ensureLocalHousehold } from '../data/bootstrap';
import type { FridgeDb } from '../data/db';
import { createInventoryHandlers } from '../data/handlers';
import { messages } from './messages.de-CH';

type SeedItem = Omit<
  OperationInput<'inventory.addItem'>,
  'commandId' | 'householdId' | 'expiresOn'
> & {
  /** Days from the real «today» (the provider uses it as well). */
  inDays?: number;
};

/**
 * Test helper: creates the local household (as `AppDataProvider` does) and seeds items through the
 * contract handler. Returns the household id.
 */
export async function seedDb(db: FridgeDb, items: readonly SeedItem[]): Promise<Id> {
  const profile = await ensureLocalHousehold(db, browserClock, browserIds, {
    household: messages.defaults.householdName,
    member: messages.defaults.memberName,
  });
  const handlers = createInventoryHandlers({
    db,
    clock: browserClock,
    ids: browserIds,
    actor: profile.member.id,
  });
  for (const { inDays, ...item } of items) {
    await handlers['inventory.addItem']({
      ...item,
      commandId: browserIds.next(),
      householdId: profile.household.id,
      ...(inDays === undefined
        ? {}
        : { expiresOn: addDays(browserClock.today(), inDays), expirySource: 'manual' }),
    });
  }
  return profile.household.id;
}
