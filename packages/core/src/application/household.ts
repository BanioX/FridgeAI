import { CONTRACT_V1 } from '../contract/operations';
import { CommandError, type AppContext, type UseCase } from './command';
import { createMemberUseCases } from './members';

/**
 * Data portability (ADR-0020), ADR-0034 layer 2. Export hands out everything of the household,
 * deleted rows included: it is the person's data. Delete and import administer the whole device
 * database and stay in the data layer.
 */
export function createHouseholdUseCases(ctx: AppContext) {
  const { storage, clock } = ctx;
  const exportAll: UseCase<'household.export'> = (raw) => {
    const input = CONTRACT_V1['household.export'].input.parse(raw);
    return storage.transaction(async () => {
      const household = await storage.households.get(input.householdId);
      if (household === undefined) {
        throw new CommandError('not_found', `Household ${input.householdId} not found`);
      }
      const id = input.householdId;
      const [
        members,
        products,
        items,
        outcomes,
        shoppingItems,
        receipts,
        receiptLines,
        ownRecipes,
        spots,
        events,
      ] = await Promise.all([
        storage.members.ofHousehold(id),
        storage.products.ofHousehold(id),
        storage.items.ofHousehold(id),
        storage.outcomes.ofHousehold(id),
        storage.shoppingItems.ofHousehold(id),
        storage.receipts.ofHousehold(id),
        storage.receiptLines.ofHousehold(id),
        storage.ownRecipes.ofHousehold(id),
        storage.spots.ofHousehold(id),
        storage.events.ofHousehold(id),
      ]);
      return CONTRACT_V1['household.export'].output.parse({
        format: 'fridgeai-export',
        contractVersion: 'v1',
        exportedAt: clock.now(),
        household,
        members,
        products,
        items,
        outcomes,
        shoppingItems,
        receipts,
        receiptLines,
        ownRecipes,
        spots,
        events,
      });
    });
  };

  return { 'household.export': exportAll, ...createMemberUseCases(ctx) };
}
