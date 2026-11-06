import { z } from 'zod';
import { RappenSchema } from '../money';
import { CategoryIdSchema, StorageLocationSchema, type StorageLocation } from '../model/primitives';

/**
 * best_before = Mindesthaltbarkeitsdatum (MHD): often still good after the date.
 * use_by = Verbrauchsdatum («zu verbrauchen bis»): do not eat after the date (food safety).
 */
export const DateKindSchema = z.enum(['best_before', 'use_by']);
export type DateKind = z.infer<typeof DateKindSchema>;

export const CategoryGroupSchema = z.enum([
  'dairy',
  'meat',
  'fish',
  'produce',
  'bakery',
  'pantry',
  'frozen',
  'drinks',
  'prepared',
  'non_food',
]);
export type CategoryGroup = z.infer<typeof CategoryGroupSchema>;

const ShelfLifeDaysSchema = z.int().positive().max(3650).nullable();

/** Built-in category: drives expiry estimation, emoji, cost-split default and receipt matching. */
export const CategorySchema = z
  .object({
    id: CategoryIdSchema,
    name: z.object({ de: z.string().min(1).max(40) }),
    emoji: z.string().min(1).max(16),
    group: CategoryGroupSchema,
    isFood: z.boolean(),
    dateKind: DateKindSchema,
    defaultLocation: StorageLocationSchema,
    /** Typical days from purchase until expiry per location; null = not suitable there. */
    shelfLifeDays: z.object({
      fridge: ShelfLifeDaysSchema,
      freezer: ShelfLifeDaysSchema,
      pantry: ShelfLifeDaysSchema,
    }),
    /** Typical price of one pack, used when a receipt price is missing (marked as estimate). */
    avgPriceRappen: RappenSchema.min(0).optional(),
    /** Typical weight of one pack in grams, for the kg counter. */
    avgWeightGrams: z.int().positive().optional(),
    /** Whether receipt lines of this category default to «geteilt» (e.g. salt, toilet paper). */
    defaultOwner: z.enum(['shared', 'buyer']),
    /** Lower-case words that identify the category on receipts (matching, step 4d). */
    keywords: z.array(z.string().regex(/^[a-zäöüéèà0-9 -]+$/)).min(1),
    /** Short storage and leftover tips, max. 3 (R-04). */
    tips: z.object({ de: z.array(z.string().min(1).max(140)).max(3) }),
  })
  .refine((category) => category.shelfLifeDays[category.defaultLocation] !== null, {
    message: 'The default location needs a shelf life',
  })
  .refine((category) => category.isFood || category.group === 'non_food', {
    message: 'Non-food categories belong to the non_food group',
  });
export type Category = z.infer<typeof CategorySchema>;

export function isFreezable(category: Category): boolean {
  return category.shelfLifeDays.freezer !== null;
}

export function shelfLifeAt(category: Category, location: StorageLocation): number | null {
  return category.shelfLifeDays[location];
}
