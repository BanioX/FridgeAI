import { CONTRACT_V1 } from '../contract/operations';
import type { Id } from '../ids';
import type { RecipeProvider } from '../ports';
import {
  cleanRecipeLines,
  OwnRecipeSchema,
  ownRecipeToRankable,
  parseIngredientLine,
  type OwnRecipe,
  type RecipeSource,
} from '../recipes/own-recipe';
import {
  ingredientsAtHome,
  listRecipes,
  suggestRecipes,
  type RankableRecipe,
} from '../recipes/recipe';
import { RECIPES } from '../recipes/recipes.de-CH';
import { CommandError, createCommandKit, type AppContext, type UseCase } from './command';
import { categoryOf } from './inventory-shared';

/** The curated collection that ships with the app (ADR-0048); no server, no costs. */
export const localRecipes: RecipeProvider = { recipes: () => Promise.resolve(RECIPES) };

/**
 * `recipes.suggest`, `recipes.list` and `recipes.get` (ADR-0048), ADR-0034 layer 2: rank the
 * recipes against the active inventory, rescuing what expires first. Read-only, via the ports.
 * The household's own recipes (point 7) are ranked together with the curated ones.
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
          readyMade: item.readyMade,
        };
      });
  }

  /** The household's recipes that are not deleted. */
  async function ownOf(householdId: Id): Promise<OwnRecipe[]> {
    return (await storage.ownRecipes.ofHousehold(householdId)).filter(
      (recipe) => recipe.deletedAt === undefined,
    );
  }

  /** Own recipes first, then the curated collection, each with where it comes from. */
  async function allRecipes(householdId: Id) {
    const [own, curated] = await Promise.all([ownOf(householdId), provider.recipes()]);
    const source = new Map<string, RecipeSource>(own.map((recipe) => [recipe.id, 'own']));
    return {
      recipes: [...own.map(ownRecipeToRankable), ...curated] as RankableRecipe[],
      sourceOf: (id: string): RecipeSource => source.get(id) ?? 'curated',
    };
  }

  const suggest: UseCase<'recipes.suggest'> = async (raw) => {
    const input = CONTRACT_V1['recipes.suggest'].input.parse(raw);
    const [{ recipes, sourceOf }, food] = await Promise.all([
      allRecipes(input.householdId),
      foodAtHome(input.householdId),
    ]);
    return {
      recipes: suggestRecipes(recipes, food, clock.today(), input.limit).map((entry) => ({
        ...entry,
        source: sourceOf(entry.id),
      })),
    };
  };

  const list: UseCase<'recipes.list'> = async (raw) => {
    const input = CONTRACT_V1['recipes.list'].input.parse(raw);
    const [{ recipes, sourceOf }, food] = await Promise.all([
      allRecipes(input.householdId),
      foodAtHome(input.householdId),
    ]);
    return {
      recipes: listRecipes(recipes, food, clock.today(), input.tag).map((entry) => ({
        ...entry,
        source: sourceOf(entry.id),
      })),
    };
  };

  const get: UseCase<'recipes.get'> = async (raw) => {
    const input = CONTRACT_V1['recipes.get'].input.parse(raw);
    const { recipes, sourceOf } = await allRecipes(input.householdId);
    const recipe = recipes.find((entry) => entry.id === input.recipeId);
    if (recipe === undefined) {
      return { recipe: null };
    }
    const food = await foodAtHome(input.householdId);
    return {
      recipe: {
        id: recipe.id,
        title: recipe.title,
        source: sourceOf(recipe.id),
        ...(recipe.minutes === undefined ? {} : { minutes: recipe.minutes }),
        ...(recipe.servings === undefined ? {} : { servings: recipe.servings }),
        tags: [...recipe.tags],
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
        steps: [...recipe.steps],
      },
    };
  };

  return { 'recipes.suggest': suggest, 'recipes.list': list, 'recipes.get': get };
}

export type RecipeQueries = ReturnType<typeof createRecipeQueries>;

/**
 * `recipes.create`, `recipes.update` and `recipes.delete` (ADR-0048, point 7): the household's own
 * recipes. Lines arrive as pasted; they are cleaned (bullets, numbers, empty lines) and every
 * ingredient is parsed and matched to a category, so «Da» / «Fehlt» works like for curated ones.
 */
export function createRecipeCommands(ctx: AppContext) {
  const { storage, clock, ids } = ctx;
  const { event, runCommand } = createCommandKit(ctx);

  function fields(input: {
    title: string;
    minutes?: number | undefined;
    servings?: number | undefined;
    ingredients: string[];
    steps: string[];
  }) {
    return {
      title: input.title,
      ...(input.minutes === undefined ? {} : { minutes: input.minutes }),
      ...(input.servings === undefined ? {} : { servings: input.servings }),
      ingredients: cleanRecipeLines(input.ingredients).map(parseIngredientLine),
      steps: cleanRecipeLines(input.steps),
    };
  }

  async function activeRecipe(householdId: Id, recipeId: Id): Promise<OwnRecipe> {
    const row = await storage.ownRecipes.get(recipeId);
    if (row?.householdId !== householdId || row.deletedAt !== undefined) {
      throw new CommandError('not_found', `Recipe ${recipeId} not found`);
    }
    return row;
  }

  const create: UseCase<'recipes.create'> = async (raw) => {
    const input = CONTRACT_V1['recipes.create'].input.parse(raw);
    return runCommand('recipes.create', input.commandId, async () => {
      const now = clock.now();
      const row = OwnRecipeSchema.parse({
        id: ids.next(),
        householdId: input.householdId,
        updatedAt: now,
        createdAt: now,
        ...fields(input),
      });
      await storage.ownRecipes.add(row);
      await storage.events.append(event(input.householdId, 'recipe.created', { recipeId: row.id }));
      return { recipeId: row.id };
    });
  };

  const update: UseCase<'recipes.update'> = async (raw) => {
    const input = CONTRACT_V1['recipes.update'].input.parse(raw);
    return runCommand('recipes.update', input.commandId, async () => {
      const row = await activeRecipe(input.householdId, input.recipeId);
      // Replace, not merge: a field the person emptied (minutes) must go away.
      await storage.ownRecipes.put(
        OwnRecipeSchema.parse({
          id: row.id,
          householdId: row.householdId,
          createdAt: row.createdAt,
          updatedAt: clock.now(),
          ...fields(input),
        }),
      );
      await storage.events.append(
        event(input.householdId, 'recipe.updated', { recipeId: input.recipeId }),
      );
      return { updated: true };
    });
  };

  const remove: UseCase<'recipes.delete'> = async (raw) => {
    const input = CONTRACT_V1['recipes.delete'].input.parse(raw);
    return runCommand('recipes.delete', input.commandId, async () => {
      const row = await activeRecipe(input.householdId, input.recipeId);
      const now = clock.now();
      await storage.ownRecipes.put(
        OwnRecipeSchema.parse({ ...row, deletedAt: now, updatedAt: now }),
      );
      await storage.events.append(
        event(input.householdId, 'recipe.deleted', { recipeId: input.recipeId }),
      );
      return { deleted: true };
    });
  };

  return { 'recipes.create': create, 'recipes.update': update, 'recipes.delete': remove };
}

export type RecipeCommands = ReturnType<typeof createRecipeCommands>;
