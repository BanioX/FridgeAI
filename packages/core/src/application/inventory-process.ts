import { addDays } from '../dates';
import { categoryById, normalizeFoodText } from '../catalog/match';
import { CONTRACT_V1 } from '../contract/operations';
import { estimateExpiry } from '../expiry';
import {
  InventoryItemSchema,
  ProductSchema,
  type InventoryItem,
  type ItemOrigin,
} from '../model/inventory';
import type { Id } from '../ids';
import type { LocalDate } from '../model/primitives';
import { rappen } from '../money';
import { CommandError, createCommandKit, type AppContext, type UseCase } from './command';
import { activeItem } from './inventory-shared';
import { createMinStockEnsurer } from './min-stock';
import { createOutcomeWriter } from './outcome-writer';

/** Without a category of its own, a result lands in the category of its kind (ADR-0052). */
const CATEGORY_OF_KIND: Record<ItemOrigin, string> = {
  made: 'bakery-homemade',
  leftover: 'prepared-leftovers',
};

/** «Verarbeiten» (ADR-0052): ingredients are used up, a new item may come out; the value moves. */
export function createProcessCommands(ctx: AppContext) {
  const { storage, clock, ids } = ctx;
  const { event, runCommand } = createCommandKit(ctx);
  const writeOutcome = createOutcomeWriter(ctx);
  const ensureMinStock = createMinStockEnsurer(ctx);

  const process: UseCase<'inventory.process'> = async (raw) => {
    const input = CONTRACT_V1['inventory.process'].input.parse(raw);
    return runCommand('inventory.process', input.commandId, async () => {
      // Check everything first, so nothing is half done.
      const items: InventoryItem[] = [];
      for (const ingredient of input.ingredients) {
        items.push(await activeItem(storage, input.householdId, ingredient.itemId));
      }
      const resultId: Id | undefined = input.result === undefined ? undefined : ids.next();

      const outcomeIds: Id[] = [];
      let total = 0;
      let estimated = false;
      for (const [index, ingredient] of input.ingredients.entries()) {
        const item = items[index];
        if (item === undefined) {
          continue;
        }
        const written = await writeOutcome(item, {
          outcome: 'eaten',
          ...(ingredient.quantity === undefined ? {} : { quantity: ingredient.quantity }),
          ...(resultId === undefined ? {} : { madeInto: resultId }),
        });
        outcomeIds.push(written.eventId);
        total += written.valueRappen;
        estimated = estimated || written.valueEstimated;
      }

      // The ingredients are gone: staples among them go back on «Nachkaufen» (ADR-0059).
      for (const productId of new Set(items.map((item) => item.productId))) {
        await ensureMinStock(input.householdId, productId);
      }

      let expiresOn: LocalDate | undefined;
      if (input.result !== undefined && resultId !== undefined) {
        const { name, kind, location } = input.result;
        const category =
          (input.result.categoryId === undefined
            ? undefined
            : categoryById(input.result.categoryId)) ?? categoryById(CATEGORY_OF_KIND[kind]);
        if (category === undefined) {
          throw new CommandError('unknown_category', 'Category of the result is missing');
        }
        const now = clock.now();
        const today = clock.today();
        const normalized = normalizeFoodText(name);
        let product = (await storage.products.ofHousehold(input.householdId)).find(
          (candidate) =>
            candidate.deletedAt === undefined &&
            candidate.categoryId === category.id &&
            normalizeFoodText(candidate.name) === normalized,
        );
        if (product === undefined) {
          product = ProductSchema.parse({
            id: ids.next(),
            householdId: input.householdId,
            updatedAt: now,
            name,
            categoryId: category.id,
            defaultLocation: category.defaultLocation,
            source: 'manual',
          });
          await storage.products.add(product);
        }
        expiresOn =
          estimateExpiry(category, location, today) ??
          estimateExpiry(category, category.defaultLocation, today) ??
          addDays(today, 3);
        const owners = new Set(items.map((item) => item.owner));
        const [onlyOwner] = [...owners];
        const result = InventoryItemSchema.parse({
          id: resultId,
          householdId: input.householdId,
          updatedAt: now,
          productId: product.id,
          location,
          quantity: 1,
          unit: 'pcs',
          purchasedAt: now,
          expiresOn,
          expiryKind: category.dateKind,
          expirySource: 'category_estimate',
          ...(location === 'freezer' ? { frozenOn: today } : {}),
          // The value moves along; with nothing that went in there is nothing to claim.
          ...(items.length === 0
            ? {}
            : { priceRappen: rappen(total), ...(estimated ? { priceEstimated: true } : {}) }),
          origin: kind,
          ...(items.length === 0 ? {} : { madeFrom: items.map((item) => item.id) }),
          owner: owners.size === 1 && onlyOwner !== undefined ? onlyOwner : 'shared',
          status: 'active',
        });
        await storage.items.add(result);
        await storage.events.append(
          event(input.householdId, 'item.added', {
            itemId: result.id,
            productId: product.id,
            location: result.location,
            expiresOn,
          }),
        );
      }

      await storage.events.append(
        event(input.householdId, 'item.processed', {
          ingredientIds: items.map((item) => item.id),
          ...(resultId === undefined ? {} : { resultId }),
          ...(input.recipeId === undefined ? {} : { recipeId: input.recipeId }),
          kind: input.result?.kind ?? 'cooked',
        }),
      );
      return {
        ...(resultId === undefined ? {} : { resultItemId: resultId }),
        outcomeIds,
        valueRappen: rappen(total),
        valueEstimated: estimated,
        ...(expiresOn === undefined ? {} : { expiresOn }),
      };
    });
  };

  return { 'inventory.process': process };
}
