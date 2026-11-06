import { z } from 'zod';
import { IdSchema } from '../ids';
import { RappenSchema } from '../money';
import {
  CategoryIdSchema,
  DateKindSchema,
  ExpirySourceSchema,
  GtinSchema,
  IsoDateTimeSchema,
  LocalDateSchema,
  OwnerSchema,
  QuantitySchema,
  RetailerSchema,
  StorageLocationSchema,
  syncFields,
  UnitSchema,
} from './primitives';

export const ProductSourceSchema = z.enum(['off', 'receipt', 'manual']);

const GramsPer100 = z.number().min(0).max(100);

/** Nutrition facts per 100 g or 100 ml, as printed on the pack (all optional). */
export const NutritionSchema = z.object({
  basis: z.enum(['100g', '100ml']),
  energyKcal: z.number().min(0).max(900).optional(),
  fat: GramsPer100.optional(),
  saturatedFat: GramsPer100.optional(),
  carbohydrates: GramsPer100.optional(),
  sugars: GramsPer100.optional(),
  fiber: GramsPer100.optional(),
  protein: GramsPer100.optional(),
  salt: GramsPer100.optional(),
  /** Where the values come from: product databases, the BLV database (per category) or a partner. */
  source: z.enum(['off', 'openfoodrepo', 'blv', 'manual', 'partner']),
});
export type Nutrition = z.infer<typeof NutritionSchema>;

/** Master data of a product, shared within the household (cached from Open Food Facts or learned). */
export const ProductSchema = z.object({
  ...syncFields,
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(80).optional(),
  gtin: GtinSchema.optional(),
  categoryId: CategoryIdSchema,
  defaultLocation: StorageLocationSchema,
  source: ProductSourceSchema,
  /** Retailer article numbers, for future rebuy partners (plan, section 2). */
  externalRefs: z.partialRecord(RetailerSchema, z.string().min(1).max(64)).optional(),
  /** Pack size as printed, e.g. «1 l», «500 g». */
  packSize: z.string().trim().max(30).optional(),
  nutrition: NutritionSchema.optional(),
  nutriScore: z.enum(['a', 'b', 'c', 'd', 'e']).optional(),
  /** Normalised allergen tags, e.g. `milk`, `gluten`, `nuts`. */
  allergens: z
    .array(z.string().regex(/^[a-z][a-z0-9-]{1,40}$/))
    .max(20)
    .optional(),
});
export type Product = z.infer<typeof ProductSchema>;

export const ItemStatusSchema = z.enum(['active', 'eaten', 'shared_out', 'wasted']);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

export const InventoryItemSchema = z.object({
  ...syncFields,
  productId: IdSchema,
  location: StorageLocationSchema,
  quantity: QuantitySchema,
  unit: UnitSchema,
  purchasedAt: IsoDateTimeSchema,
  /** Calendar day of expiry (Europe/Zurich), not an instant. */
  expiresOn: LocalDateSchema,
  /** MHD or use-by: from the category by default, from a GS1 code or the label when known. */
  expiryKind: DateKindSchema,
  /** How the date was obtained; anything but `category_estimate` is a real date. */
  expirySource: ExpirySourceSchema,
  /** Day the item went into the freezer, if it is frozen. */
  frozenOn: LocalDateSchema.optional(),
  priceRappen: RappenSchema.min(0).optional(),
  owner: OwnerSchema,
  status: ItemStatusSchema,
  statusChangedAt: IsoDateTimeSchema.optional(),
  receiptLineId: IdSchema.optional(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const OutcomeSchema = z.enum(['eaten', 'shared_out', 'wasted']);
export type Outcome = z.infer<typeof OutcomeSchema>;

/**
 * What happened to (part of) an item. Called WasteEvent in the brief; it also records eaten and
 * shared items, which feed the «gerettet» counter. Undo = soft delete.
 */
export const OutcomeEventSchema = z.object({
  ...syncFields,
  itemId: IdSchema,
  outcome: OutcomeSchema,
  quantity: QuantitySchema,
  valueRappen: RappenSchema.min(0),
  valueEstimated: z.boolean(),
  grams: z.int().min(0).optional(),
  /** Owner of the item at that moment (snapshot for per-person statistics). */
  owner: OwnerSchema,
  at: IsoDateTimeSchema,
  by: IdSchema,
});
export type OutcomeEvent = z.infer<typeof OutcomeEventSchema>;

/** An item offered to the other household members before it expires (Rette-Kreis). */
export const RescueOfferSchema = z
  .object({
    ...syncFields,
    itemId: IdSchema,
    offeredBy: IdSchema,
    offeredAt: IsoDateTimeSchema,
    claimedBy: IdSchema.optional(),
    claimedAt: IsoDateTimeSchema.optional(),
    withdrawnAt: IsoDateTimeSchema.optional(),
  })
  .refine((offer) => !(offer.claimedAt !== undefined && offer.withdrawnAt !== undefined), {
    message: 'An offer cannot be both claimed and withdrawn',
  })
  .refine((offer) => (offer.claimedBy === undefined) === (offer.claimedAt === undefined), {
    message: 'claimedBy and claimedAt belong together',
  });
export type RescueOffer = z.infer<typeof RescueOfferSchema>;

/** Learned mapping from a receipt text to a product/category, built from user corrections. */
export const ProductAliasSchema = z.object({
  ...syncFields,
  retailer: RetailerSchema,
  normalizedText: z.string().min(1).max(120),
  productId: IdSchema.optional(),
  categoryId: CategoryIdSchema,
  hits: z.int().min(1),
});
export type ProductAlias = z.infer<typeof ProductAliasSchema>;

export const ShoppingListItemSchema = z.object({
  ...syncFields,
  name: z.string().trim().min(1).max(80),
  productId: IdSchema.optional(),
  categoryId: CategoryIdSchema.optional(),
  quantity: QuantitySchema.optional(),
  unit: UnitSchema.optional(),
  checked: z.boolean(),
  checkedAt: IsoDateTimeSchema.optional(),
  addedBy: IdSchema,
});
export type ShoppingListItem = z.infer<typeof ShoppingListItemSchema>;
