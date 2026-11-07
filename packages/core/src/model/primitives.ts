import { z } from 'zod';
import { IdSchema } from '../ids';

/** A calendar day in Europe/Zurich, `YYYY-MM-DD`. Used for expiry dates (see plan, section 1). */
export const LocalDateSchema = z.iso.date().brand<'LocalDate'>();
export type LocalDate = z.infer<typeof LocalDateSchema>;

/** An instant in UTC, ISO 8601 with `Z`, e.g. `2026-11-06T15:00:00.000Z`. */
export const IsoDateTimeSchema = z.iso.datetime().brand<'IsoDateTime'>();
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;

/** Local time of day `HH:MM`, e.g. for the daily digest. */
export const TimeOfDaySchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM');

/**
 * Where food is kept. `reserve` = «Notvorrat»: long-term emergency stock (Swiss federal advice
 * «Kluger Rat – Notvorrat»), also for preppers and organisations with decades-long shelf lives.
 */
export const StorageLocationSchema = z.enum(['fridge', 'freezer', 'pantry', 'reserve']);
export type StorageLocation = z.infer<typeof StorageLocationSchema>;
export const STORAGE_LOCATIONS = StorageLocationSchema.options;

/** Base units for all calculations; display units (kg, dl, l …) are derived (core/quantity.ts). */
export const UnitSchema = z.enum(['pcs', 'g', 'ml']);
export type Unit = z.infer<typeof UnitSchema>;

/** How pieces are packed, as people say it: «2 Becher», «1 Flasche», «1 Bund». */
export const ContainerSchema = z.enum([
  'piece',
  'cup',
  'pack',
  'bottle',
  'can',
  'jar',
  'bunch',
  'bag',
  'box',
]);
export type Container = z.infer<typeof ContainerSchema>;

/** Content of one piece, e.g. «Becher à 180 g». */
export const PackageSizeSchema = z.object({
  amount: z.number().positive(),
  unit: z.enum(['g', 'ml']),
});
export type PackageSize = z.infer<typeof PackageSizeSchema>;

/**
 * best_before = Mindesthaltbarkeitsdatum (MHD): often still good after the date.
 * use_by = Verbrauchsdatum («zu verbrauchen bis»): do not eat after the date (food safety).
 */
export const DateKindSchema = z.enum(['best_before', 'use_by']);
export type DateKind = z.infer<typeof DateKindSchema>;

/**
 * Where an expiry date came from. Built ahead of the industry (ADR-0006): today most dates are
 * estimated or typed in; 2D codes (GS1 DataMatrix / Digital Link) and label photos can carry the
 * real date, partners may deliver it with digital receipts.
 */
export const ExpirySourceSchema = z.enum([
  'category_estimate',
  'manual',
  'gs1_code',
  'label_ocr',
  'partner',
  /** Shortened by the «after opening» rule (ADR-0011). */
  'after_opening',
]);
export type ExpirySource = z.infer<typeof ExpirySourceSchema>;

export const RetailerSchema = z.enum(['migros', 'coop', 'aldi', 'lidl', 'denner', 'other']);
export type Retailer = z.infer<typeof RetailerSchema>;

/** Stable slug of a built-in category, e.g. `dairy-milk`. */
export const CategoryIdSchema = z.string().regex(/^[a-z][a-z0-9-]{1,40}$/, 'Expected a slug');
export type CategoryId = z.infer<typeof CategoryIdSchema>;

/** Who an item or receipt line belongs to: a member, or everyone in the household. */
export const OwnerSchema = z.union([IdSchema, z.literal('shared')]);
export type Owner = z.infer<typeof OwnerSchema>;

/** A positive, finite quantity (pieces may be fractional, e.g. half a cucumber). */
export const QuantitySchema = z.number().positive();

/** Fields every synced entity carries (ADR-0003). */
export const syncFields = {
  id: IdSchema,
  householdId: IdSchema,
  updatedAt: IsoDateTimeSchema,
  deletedAt: IsoDateTimeSchema.optional(),
};

/** Validates a GTIN-8/12/13/14 (EAN/UPC) including its check digit. */
export function isValidGtin(value: string): boolean {
  if (!/^(?:\d{8}|\d{12,14})$/.test(value)) {
    return false;
  }
  const digits = Array.from(value, Number);
  const check = digits.pop();
  const sum = digits
    .reverse()
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export const GtinSchema = z.string().refine(isValidGtin, 'Invalid GTIN/EAN').brand<'Gtin'>();
export type Gtin = z.infer<typeof GtinSchema>;
