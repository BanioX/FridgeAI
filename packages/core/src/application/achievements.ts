import { achievements } from '../achievements';
import { CONTRACT_V1 } from '../contract/operations';
import { categoryById, fallbackCategory } from '../catalog/match';
import type { AppContext, UseCase } from './command';

/**
 * `stats.achievements` (ADR-0054, docs/abzeichen.md): reads the household's own data through the
 * ports and lets the pure `achievements` compute. Nothing is stored; nothing leaves the device.
 */
export function createAchievementQueries({ storage, clock }: AppContext) {
  const query: UseCase<'stats.achievements'> = async (raw) => {
    const { householdId } = CONTRACT_V1['stats.achievements'].input.parse(raw);
    const [items, products, outcomes, events, recipes, receipts, members] = await Promise.all([
      storage.items.ofHousehold(householdId),
      storage.products.ofHousehold(householdId),
      storage.outcomes.ofHousehold(householdId),
      storage.events.ofHousehold(householdId),
      storage.ownRecipes.ofHousehold(householdId),
      storage.receipts.ofHousehold(householdId),
      storage.members.ofHousehold(householdId),
    ]);
    const categoryOfProduct = new Map(
      products.map((product) => [
        product.id,
        (categoryById(product.categoryId) ?? fallbackCategory()).id,
      ]),
    );
    return {
      achievements: achievements(
        {
          outcomes,
          items: items.map((item) => ({
            ...item,
            categoryId: categoryOfProduct.get(item.productId) ?? fallbackCategory().id,
          })),
          events,
          recipes,
          receipts,
          memberCount: members.filter(
            (member) => member.deletedAt === undefined && member.leftAt === undefined,
          ).length,
        },
        clock.today(),
      ),
    };
  };

  return { 'stats.achievements': query };
}
