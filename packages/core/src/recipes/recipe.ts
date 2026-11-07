import { z } from 'zod';
import { normalizeFoodText } from '../catalog/match';
import { expiryStatus, SOON_THRESHOLD_DAYS } from '../expiry';
import {
  CategoryIdSchema,
  type CategoryId,
  type DateKind,
  type LocalDate,
} from '../model/primitives';

export const RecipeIngredientSchema = z.object({
  /** As shown, e.g. «200 g Blattspinat». */
  text: z.string().min(1),
  /** Which food at home counts as this ingredient: its category or a word in its name. */
  categories: z.array(CategoryIdSchema).default([]),
  words: z.array(z.string().min(2)).default([]),
  /** Salt, oil, flour, spices: assumed at home, never «missing». */
  staple: z.boolean().default(false),
  /** Nice to have: used when there, never «missing». */
  optional: z.boolean().default(false),
});
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

export const RecipeTagSchema = z.enum(['vegetarisch', 'vegan', 'schnell', 'eiweissreich']);

/** A recipe of the curated collection (plan 11b): written for Rettich, no third-party texts. */
export const RecipeSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]{2,60}$/),
    title: z.string().min(3),
    minutes: z.int().positive().max(240),
    servings: z.int().positive().max(12),
    ingredients: z.array(RecipeIngredientSchema).min(2),
    steps: z.array(z.string().min(5)).min(1),
    tags: z.array(RecipeTagSchema).default([]),
  })
  .refine(
    (recipe) =>
      recipe.ingredients.every(
        (ingredient) =>
          ingredient.staple || ingredient.categories.length > 0 || ingredient.words.length > 0,
      ),
    { message: 'Every ingredient but staples needs a category or a word to match food at home' },
  );
export type Recipe = z.infer<typeof RecipeSchema>;

/** What the ranking needs to know about a food at home (an `InventoryItemView` fits). */
export interface FoodAtHome {
  name: string;
  categoryId: CategoryId;
  expiresOn: LocalDate;
  expiryKind: DateKind;
}

export interface RecipeSuggestion {
  id: string;
  title: string;
  minutes: number;
  /** Names of soon-expiring food the recipe uses, most urgent first. */
  usesExpiring: string[];
  /** Ingredients to buy (as written in the recipe). */
  missing: string[];
}

function matches(ingredient: RecipeIngredient, food: FoodAtHome): boolean {
  if (ingredient.categories.includes(food.categoryId)) {
    return true;
  }
  const name = ` ${normalizeFoodText(food.name)} `;
  return ingredient.words.some((word) => name.includes(normalizeFoodText(word)));
}

/** 3 for today or past best-before, 2 for tomorrow, 1 within three days, else 0. */
function urgency(food: FoodAtHome, today: LocalDate): number {
  const status = expiryStatus(food.expiresOn, today, food.expiryKind, SOON_THRESHOLD_DAYS);
  switch (status.kind) {
    case 'today':
    case 'past_best_before':
      return 3;
    case 'soon':
      return status.daysLeft === 1 ? 2 : 1;
    case 'fresh':
    case 'past_use_by':
      return 0;
  }
}

/**
 * Recipes that rescue the most urgent food (plan 11b, R-01): only recipes that use at least one
 * food expiring within three days, ranked by how urgent that food is, then by fewer missing
 * ingredients and fewer minutes. Food past its use-by date is never suggested (food safety).
 */
export function suggestRecipes(
  recipes: readonly Recipe[],
  food: readonly FoodAtHome[],
  today: LocalDate,
  limit: number,
): RecipeSuggestion[] {
  const usable = food
    .filter(
      (entry) => expiryStatus(entry.expiresOn, today, entry.expiryKind).kind !== 'past_use_by',
    )
    .map((entry) => ({ entry, urgency: urgency(entry, today) }));

  const ranked = recipes.map((recipe) => {
    const used = new Map<string, number>();
    const missing: string[] = [];
    for (const ingredient of recipe.ingredients) {
      if (ingredient.staple) {
        continue;
      }
      const atHome = usable.filter(({ entry }) => matches(ingredient, entry));
      for (const { entry, urgency: weight } of atHome) {
        if (weight > 0) {
          used.set(entry.name, Math.max(used.get(entry.name) ?? 0, weight));
        }
      }
      if (atHome.length === 0 && !ingredient.optional) {
        missing.push(ingredient.text);
      }
    }
    const usesExpiring = [...used.entries()]
      .sort(([nameA, a], [nameB, b]) => b - a || nameA.localeCompare(nameB, 'de-CH'))
      .map(([name]) => name);
    const score = [...used.values()].reduce((sum, weight) => sum + weight, 0);
    return { recipe, usesExpiring, missing, score };
  });

  return ranked
    .filter(({ usesExpiring }) => usesExpiring.length > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.missing.length - b.missing.length ||
        a.recipe.minutes - b.recipe.minutes ||
        a.recipe.id.localeCompare(b.recipe.id),
    )
    .slice(0, Math.max(0, limit))
    .map(({ recipe, usesExpiring, missing }) => ({
      id: recipe.id,
      title: recipe.title,
      minutes: recipe.minutes,
      usesExpiring,
      missing,
    }));
}

export interface IngredientAtHome<TFood extends FoodAtHome = FoodAtHome> {
  text: string;
  staple: boolean;
  optional: boolean;
  /** Food at home that counts as this ingredient (never past its use-by date). */
  atHome: TFood[];
}

/**
 * For the recipe page: which ingredients are at home, with the same rules as the ranking. Generic,
 * so callers get back their own entries (with item ids) for «nach dem Kochen abbuchen».
 */
export function ingredientsAtHome<TFood extends FoodAtHome>(
  recipe: Recipe,
  food: readonly TFood[],
  today: LocalDate,
): IngredientAtHome<TFood>[] {
  const usable = food.filter(
    (entry) => expiryStatus(entry.expiresOn, today, entry.expiryKind).kind !== 'past_use_by',
  );
  return recipe.ingredients.map((ingredient) => ({
    text: ingredient.text,
    staple: ingredient.staple,
    optional: ingredient.optional,
    atHome: ingredient.staple ? [] : usable.filter((entry) => matches(ingredient, entry)),
  }));
}
