import { z } from 'zod';
import { matchCategoryByName } from '../catalog/match';
import { parseShoppingText } from '../shopping/parse-shopping-text';
import { CategoryIdSchema, IsoDateTimeSchema, syncFields } from '../model/primitives';
import type { RankableRecipe, RecipeIngredient } from './recipe';

/** Where a recipe comes from: shipped with the app, or written or pasted by the person. */
export type RecipeSource = 'own' | 'curated';

/**
 * One ingredient line of an own recipe: the text as the person wrote it («200 g Hörnli»), what the
 * parser read from it, and the category the matcher found, so «Da» / «Fehlt» works as for curated
 * recipes.
 */
export const OwnRecipeIngredientSchema = z.object({
  text: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  quantity: z.number().positive().optional(),
  unit: z.string().max(10).optional(),
  categoryId: CategoryIdSchema.optional(),
});
export type OwnRecipeIngredient = z.infer<typeof OwnRecipeIngredientSchema>;

/** A recipe of the household (ADR-0048, point 7). Synced fields, soft delete like other rows. */
export const OwnRecipeSchema = z.object({
  ...syncFields,
  title: z.string().trim().min(1).max(120),
  minutes: z.int().positive().max(1440).optional(),
  servings: z.int().positive().max(100).optional(),
  ingredients: z.array(OwnRecipeIngredientSchema).min(1).max(80),
  steps: z.array(z.string().min(1).max(2000)).max(80),
  createdAt: IsoDateTimeSchema,
});
export type OwnRecipe = z.infer<typeof OwnRecipeSchema>;

/** A bullet, check box or number («1.», «2)») that a copied list puts in front of a line. */
const LIST_MARK = /^(?:[-–—•*·▪◦☐□✓✔]\s*|\d{1,3}[.)]\s+)+/u;

/**
 * Lines as people paste them from anywhere: one entry may hold several lines. Trims, drops empty
 * lines and strips leading bullets and numbers, so «1. Zwiebel hacken» and «• 200 g Hörnli» just
 * work.
 */
export function cleanRecipeLines(lines: readonly string[]): string[] {
  return lines
    .flatMap((entry) => entry.split(/\r\n|\r|\n/u))
    .map((line) => line.trim().replace(LIST_MARK, '').replace(/\s+/gu, ' ').trim())
    .filter((line) => line !== '');
}

/** Reads one ingredient line: name and amount like the shopping list, category by name. */
export function parseIngredientLine(line: string): OwnRecipeIngredient {
  const [first] = parseShoppingText(line);
  const name = first?.name ?? line;
  const category = matchCategoryByName(name) ?? matchCategoryByName(line);
  return {
    text: line,
    name,
    ...(first?.quantity === undefined ? {} : { quantity: first.quantity }),
    ...(first?.unit === undefined ? {} : { unit: first.unit }),
    ...(category === null ? {} : { categoryId: category.id }),
  };
}

const toIngredient = ({ name, categoryId, text }: OwnRecipeIngredient): RecipeIngredient => ({
  text,
  categories: categoryId === undefined ? [] : [categoryId],
  words: name.length >= 2 ? [name] : [],
  staple: false,
  optional: false,
});

/** An own recipe as the ranking and the recipe page read it. */
export function ownRecipeToRankable(recipe: OwnRecipe): RankableRecipe {
  return {
    id: recipe.id,
    title: recipe.title,
    ...(recipe.minutes === undefined ? {} : { minutes: recipe.minutes }),
    ...(recipe.servings === undefined ? {} : { servings: recipe.servings }),
    ingredients: recipe.ingredients.map(toIngredient),
    steps: recipe.steps,
    tags: [],
  };
}
