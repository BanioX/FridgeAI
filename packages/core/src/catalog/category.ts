import { z } from 'zod';
import { RappenSchema } from '../money';
import {
  CategoryIdSchema,
  ContainerSchema,
  DateKindSchema,
  StorageLocationSchema,
  UnitSchema,
  type StorageLocation,
} from '../model/primitives';

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
  'reserve',
  'non_food',
]);
export type CategoryGroup = z.infer<typeof CategoryGroupSchema>;

/** Up to 100 years: freeze-dried emergency food is sold with 25–30 years, some stock lasts longer. */
const DaysSchema = z.int().positive().max(36_500).nullable();

/** Typical days from purchase until expiry per location; null = not suitable there. */
export const ShelfLifeDaysSchema = z.object({
  fridge: DaysSchema,
  freezer: DaysSchema,
  pantry: DaysSchema,
  /** Notvorrat; if omitted, long-lasting pantry food (≥ 90 days) keeps its pantry value. */
  reserve: DaysSchema.optional(),
});
export type ShelfLifeDays = z.infer<typeof ShelfLifeDaysSchema>;

/** Pantry food lasting at least this long may go into the Notvorrat with its pantry shelf life. */
const RESERVE_MIN_PANTRY_DAYS = 90;

export function shelfLifeAt(
  category: { shelfLifeDays: ShelfLifeDays },
  location: StorageLocation,
): number | null {
  const { shelfLifeDays } = category;
  if (location !== 'reserve') {
    return shelfLifeDays[location];
  }
  if (shelfLifeDays.reserve !== undefined) {
    return shelfLifeDays.reserve;
  }
  return shelfLifeDays.pantry !== null && shelfLifeDays.pantry >= RESERVE_MIN_PANTRY_DAYS
    ? shelfLifeDays.pantry
    : null;
}

/**
 * How people measure and split a food (ADR-0011): the unit and container the add form preselects,
 * usual pack sizes in pieces (eggs: 6 and 10) and the fractions offered when only part is eaten,
 * as denominators (8 → ⅛ of a cake, 3 → ⅓ of a cheese). No splits: whole pieces only (eggs).
 */
export const PortioningSchema = z
  .object({
    unit: UnitSchema,
    container: ContainerSchema.optional(),
    packs: z.array(z.int().min(2).max(100)).min(1).max(4).optional(),
    splits: z.array(z.int().min(2).max(12)).max(3),
  })
  .refine((portioning) => portioning.packs === undefined || portioning.unit === 'pcs', {
    message: 'Pack sizes count pieces',
  });
export type Portioning = z.infer<typeof PortioningSchema>;

/** Categories without their own rule: counted in pieces, one piece splits into quarters. */
export const DEFAULT_PORTIONING: Portioning = { unit: 'pcs', splits: [4] };

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
    shelfLifeDays: ShelfLifeDaysSchema,
    /** «Nach dem Öffnen innert N Tagen verbrauchen» – typical days after opening (ADR-0011). */
    afterOpeningDays: z.int().min(0).max(3650).optional(),
    /**
     * Also sold loose at the counter (Theke): cheese, cold cuts, salmon, dips. Bought there, it
     * keeps only as long as an open pack (ADR-0038).
     */
    soldLoose: z.boolean().optional(),
    /** Why it does not freeze well (shown before freezing food with no freezer shelf life). */
    freezeNote: z.object({ de: z.string().min(1).max(140) }).optional(),
    /** Typical price of one pack, used when a receipt price is missing (marked as estimate). */
    avgPriceRappen: RappenSchema.min(0).optional(),
    /** Typical weight of one pack in grams, for the kg counter. */
    avgWeightGrams: z.int().positive().optional(),
    /** Units, packs and fractions that make sense; `portioningOf` falls back to a default. */
    portioning: PortioningSchema.optional(),
    /** Whether receipt lines of this category default to «geteilt» (e.g. salt, toilet paper). */
    defaultOwner: z.enum(['shared', 'buyer']),
    /** Lower-case words that identify the category on receipts (matching, step 4d). */
    keywords: z.array(z.string().regex(/^[a-zäöüéèà0-9 -]+$/)).min(1),
    /** Short storage and leftover tips, max. 3 (R-04). */
    tips: z.object({ de: z.array(z.string().min(1).max(140)).max(3) }),
  })
  .refine((category) => shelfLifeAt(category, category.defaultLocation) !== null, {
    message: 'The default location needs a shelf life',
  })
  .refine((category) => category.isFood || category.group === 'non_food', {
    message: 'Non-food categories belong to the non_food group',
  })
  .refine((category) => category.soldLoose !== true || category.afterOpeningDays !== undefined, {
    message: 'Food sold loose needs a shelf life after opening',
  });
export type Category = z.infer<typeof CategorySchema>;

export function portioningOf(category: Pick<Category, 'portioning'>): Portioning {
  return category.portioning ?? DEFAULT_PORTIONING;
}

export function isFreezable(category: Category): boolean {
  return category.shelfLifeDays.freezer !== null;
}
