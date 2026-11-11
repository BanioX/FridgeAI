import { CONTRACT_V1 } from '../contract/operations';
import type { Id } from '../ids';
import type { RecipeProvider } from '../ports';
import { ingredientsAtHome, listRecipes, suggestRecipes } from '../recipes/recipe';
import { RECIPES } from '../recipes/recipes.de-CH';
import type { AppContext, UseCase } from './command';
import { categoryOf } from './inventory-shared';

/** The curated collection that ships with the app (ADR-0048); no server, no costs. */
export const localRecipes: RecipeProvider = { recipes: () => Promise.resolve(RECIPES) };

/**
 * `recipes.suggest`, `recipes.list` and `recipes.get` (ADR-0048), ADR-0034 layer 2: rank the
 * recipes against the active inventory, rescuing what expires first. Read-only, via the ports.
 */
export function createRecipeQueries(ctx: AppContext, provider: RecipeProvider = localRecipes) {
  const { storage, clock } = ctx;

  /** Active, not deleted items as the ranking sees them: name, category, date and amount. */
  async function foodAtHome(householdId: Id) {
    const [items, products] = await Promise.all([
      storage.items.activeOf(householdId),
      storage.products.ofHousehold(householdId),
    ]);
    const productById = new Map(products.map((product) => [product.id, product]));
    return items
      .filter((item) => item.deletedAt === undefined && item.quantity > 0)
      .map((item) => {
        const product = productById.get(item.productId);
        const category = categoryOf(product);
        return {
          itemId: item.id,
          quantity: item.quantity,
          unit: item.unit,
          name: product?.name ?? category.name.de,
          categoryId: category.id,
          expiresOn: item.expiresOn,
          expiryKind: item.expiryKind,
        };
      });
  }

  const suggest: UseCase<'recipes.suggest'> = async (raw) => {
    const input = CONTRACT_V1['recipes.suggest'].input.parse(raw);
    const [recipes, food] = await Promise.all([provider.recipes(), foodAtHome(input.householdId)]);
    return { recipes: suggestRecipes(recipes, food, clock.today(), input.limit) };
  };

  const list: UseCase<'recipes.list'> = async (raw) => {
    const input = CONTRACT_V1['recipes.list'].input.parse(raw);
    const [recipes, food] = await Promise.all([provider.recipes(), foodAtHome(input.householdId)]);
    return { recipes: listRecipes(recipes, food, clock.today(), input.tag) };
  };

  const get: UseCase<'recipes.get'> = async (raw) => {
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

  return { 'recipes.suggest': suggest, 'recipes.list': list, 'recipes.get': get };
}

export type RecipeQueries = ReturnType<typeof createRecipeQueries>;
