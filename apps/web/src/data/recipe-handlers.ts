import {
  CONTRACT_V1,
  ingredientsAtHome,
  RECIPES,
  suggestRecipes,
  type Id,
  type RecipeProvider,
} from '@fridgeai/core';
import type { Handler, HandlerContext } from './command';
import { toFoodAtHome, type ItemAtHome } from './food-at-home';

/** The curated collection that ships with the app (plan 11b); no server, no costs. */
export const localRecipes: RecipeProvider = { recipes: () => Promise.resolve(RECIPES) };

/**
 * `recipes.suggest` and `recipes.get` (plan 11b/11c): rank the recipes against the active
 * inventory, rescuing what expires first. Ranking and matching live in core.
 */
export function createRecipeHandlers(ctx: HandlerContext, provider: RecipeProvider = localRecipes) {
  const { db, clock } = ctx;

  async function foodAtHome(householdId: Id): Promise<ItemAtHome[]> {
    const [items, products] = await Promise.all([
      db.items.where('[householdId+status]').equals([householdId, 'active']).toArray(),
      db.products.where('householdId').equals(householdId).toArray(),
    ]);
    return toFoodAtHome(items, products);
  }

  const suggest: Handler<'recipes.suggest'> = async (raw) => {
    const input = CONTRACT_V1['recipes.suggest'].input.parse(raw);
    const [recipes, food] = await Promise.all([provider.recipes(), foodAtHome(input.householdId)]);
    return { recipes: suggestRecipes(recipes, food, clock.today(), input.limit) };
  };

  const get: Handler<'recipes.get'> = async (raw) => {
    const input = CONTRACT_V1['recipes.get'].input.parse(raw);
    const recipe = (await provider.recipes()).find((entry) => entry.id === input.recipeId);
    if (recipe === undefined) {
      return { recipe: null };
    }
    const food = await foodAtHome(input.householdId);
    return {
      recipe: {
        id: recipe.id,
        title: recipe.title,
        minutes: recipe.minutes,
        servings: recipe.servings,
        tags: recipe.tags,
        ingredients: ingredientsAtHome(recipe, food, clock.today()).map((ingredient) => ({
          ...ingredient,
          // Exactly the contract's fields: nothing internal leaks into API or MCP answers.
          atHome: ingredient.atHome.map(
            ({ itemId, name, quantity, unit, expiresOn, expiryKind }) => ({
              itemId,
              name,
              quantity,
              unit,
              expiresOn,
              expiryKind,
            }),
          ),
        })),
        steps: recipe.steps,
      },
    };
  };

  return { 'recipes.suggest': suggest, 'recipes.get': get };
}

export type RecipeHandlers = ReturnType<typeof createRecipeHandlers>;
