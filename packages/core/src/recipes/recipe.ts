import { z } from 'zod';
import { categoryById, normalizeFoodText } from '../catalog/match';
import { isReadyMade } from '../ready-made';
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
export type RecipeTag = z.infer<typeof RecipeTagSchema>;

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
  /** Own call of the household: true = Fertigprodukt, false = Zum Kochen; absent = category. */
  readyMade?: boolean | undefined;
}

/**
 * What the ranking needs of a recipe: the curated `Recipe` fits, and so does an own recipe
 * (ADR-0048, point 7), which may have no minutes or servings.
 */
export interface RankableRecipe {
  id: string;
  title: string;
  minutes?: number;
  servings?: number;
  ingredients: readonly RecipeIngredient[];
  steps: readonly string[];
  tags: readonly RecipeTag[];
}

/** Sorts a recipe without a known time after the ones with one. */
const minutesOf = (recipe: { minutes?: number }): number => recipe.minutes ?? 9999;

export interface RecipeSuggestion {
  id: string;
  title: string;
  /** Absent for an own recipe without a time. */
  minutes?: number;
  /** Names of soon-expiring food the recipe uses, most urgent first. */
  usesExpiring: string[];
  /** Ingredients to buy (as written in the recipe). */
  missing: string[];
}

/**
 * Whether a food at home counts as a recipe ingredient (ADR-0053). A Fertigprodukt (Skyr
 * Cheesecake, Tiramisu, Pizza) is not a raw ingredient: it never counts as «Joghurt» for a
 * Birchermüesli. Exception: an ingredient whose own category is a ready one («Oreo» of an Oreo
 * Cheesecake, Süsses & Snacks) accepts ready food. Otherwise the ingredient's category or a word
 * in the food's name decides.
 */
export function matchesIngredient(ingredient: RecipeIngredient, food: FoodAtHome): boolean {
  const wantsReady = ingredient.categories.some((id) => categoryById(id)?.ready === true);
  if (isReadyMade(food) && !wantsReady) {
    return false;
  }
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

/** «Feierabend» (Alban): at most this many minutes and nothing to buy. */
export const FEIERABEND_MINUTES = 15;

/** Cooked after work with what is at home: quick and nothing missing (staples are assumed). */
export const fitsFeierabend = (recipe: { minutes: number; missing: readonly string[] }): boolean =>
  recipe.minutes <= FEIERABEND_MINUTES && recipe.missing.length === 0;

/** A recipe in «Alle Rezepte» on «Kochen»: as a suggestion, with its tags. */
export interface RecipeListEntry extends RecipeSuggestion {
  tags: RecipeTag[];
}

interface Ranked {
  recipe: RankableRecipe;
  usesExpiring: string[];
  missing: string[];
  /** How much urgent food the recipe rescues. */
  score: number;
}

/** What each recipe rescues and lacks. Food past its use-by date never counts (food safety). */
function rank(
  recipes: readonly RankableRecipe[],
  food: readonly FoodAtHome[],
  today: LocalDate,
): Ranked[] {
  const usable = food
    .filter(
      (entry) => expiryStatus(entry.expiresOn, today, entry.expiryKind).kind !== 'past_use_by',
    )
    .map((entry) => ({ entry, urgency: urgency(entry, today) }));

  return recipes.map((recipe) => {
    const used = new Map<string, number>();
    const missing: string[] = [];
    for (const ingredient of recipe.ingredients) {
      if (ingredient.staple) {
        continue;
      }
      const atHome = usable.filter(({ entry }) => matchesIngredient(ingredient, entry));
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
}

const toSuggestion = ({ recipe, usesExpiring, missing }: Ranked): RecipeSuggestion => ({
  id: recipe.id,
  title: recipe.title,
  ...(recipe.minutes === undefined ? {} : { minutes: recipe.minutes }),
  usesExpiring,
  missing,
});

/**
 * Recipes that rescue the most urgent food (plan 11b, R-01): only recipes that use at least one
 * food expiring within three days, ranked by how urgent that food is, then by fewer missing
 * ingredients and fewer minutes. Food past its use-by date is never suggested (food safety).
 */
export function suggestRecipes(
  recipes: readonly RankableRecipe[],
  food: readonly FoodAtHome[],
  today: LocalDate,
  limit: number,
): RecipeSuggestion[] {
  return rank(recipes, food, today)
    .filter(({ usesExpiring }) => usesExpiring.length > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.missing.length - b.missing.length ||
        minutesOf(a.recipe) - minutesOf(b.recipe) ||
        a.recipe.id.localeCompare(b.recipe.id),
    )
    .slice(0, Math.max(0, limit))
    .map(toSuggestion);
}

/**
 * «Alle Rezepte» (ADR-0031): every recipe, optionally with one tag, what can be cooked with the
 * food at home first (fewest missing ingredients), then what rescues more, then the quickest.
 */
export function listRecipes(
  recipes: readonly RankableRecipe[],
  food: readonly FoodAtHome[],
  today: LocalDate,
  tag?: RecipeTag,
): RecipeListEntry[] {
  return rank(recipes, food, today)
    .filter(({ recipe }) => tag === undefined || recipe.tags.includes(tag))
    .sort(
      (a, b) =>
        a.missing.length - b.missing.length ||
        b.score - a.score ||
        minutesOf(a.recipe) - minutesOf(b.recipe) ||
        a.recipe.title.localeCompare(b.recipe.title, 'de-CH'),
    )
    .map((ranked) => ({ ...toSuggestion(ranked), tags: [...ranked.recipe.tags] }));
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
  recipe: RankableRecipe,
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
    atHome: ingredient.staple ? [] : usable.filter((entry) => matchesIngredient(ingredient, entry)),
  }));
}
