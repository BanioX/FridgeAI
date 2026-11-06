import { z } from 'zod';
import { NutritionSchema, type Nutrition } from '../model/inventory';
import type { Gtin } from '../model/primitives';
import type { ProductInfo } from '../ports';

/**
 * Open Food Facts (ODbL, ADR-0016): free product database, also strong on Swiss products. Only
 * the barcode number is sent; FridgeAI asks for the few fields it needs. The answer is untrusted
 * and validated here; fetching happens in an adapter outside the core.
 */
export const OFF_FIELDS = [
  'product_name',
  'product_name_de',
  'generic_name_de',
  'brands',
  'quantity',
  'categories_tags',
  'nutriments',
  'nutriscore_grade',
  'allergens_tags',
] as const;

export function offProductUrl(gtin: Gtin): string {
  return `https://world.openfoodfacts.org/api/v2/product/${gtin}.json?fields=${OFF_FIELDS.join(',')}`;
}

const OffResponseSchema = z.object({
  product: z
    .object({
      product_name: z.string().optional(),
      product_name_de: z.string().optional(),
      generic_name_de: z.string().optional(),
      brands: z.string().optional(),
      quantity: z.string().optional(),
      categories_tags: z.array(z.string()).optional(),
      nutriments: z.record(z.string(), z.unknown()).optional(),
      nutriscore_grade: z.string().optional(),
      allergens_tags: z.array(z.string()).optional(),
    })
    .optional(),
});

/** OFF nutriment keys per 100 g/ml → FridgeAI's nutrition fields. */
const NUTRIMENTS = {
  energyKcal: 'energy-kcal_100g',
  fat: 'fat_100g',
  saturatedFat: 'saturated-fat_100g',
  carbohydrates: 'carbohydrates_100g',
  sugars: 'sugars_100g',
  fiber: 'fiber_100g',
  protein: 'proteins_100g',
  salt: 'salt_100g',
} as const;

const text = (value: string | undefined, max: number): string | undefined => {
  const cleaned = value
    ?.replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned === undefined || cleaned === '' ? undefined : cleaned.slice(0, max);
};

/** `en:milk` → `milk`, `de:schweiz` → `schweiz`. */
const untag = (tag: string) => tag.replace(/^[a-z]{2}:/, '');

function nutritionOf(
  nutriments: Record<string, unknown> | undefined,
  quantity: string | undefined,
): Nutrition | undefined {
  if (nutriments === undefined) {
    return undefined;
  }
  const values: Partial<Record<keyof typeof NUTRIMENTS, number>> = {};
  for (const [field, key] of Object.entries(NUTRIMENTS) as [keyof typeof NUTRIMENTS, string][]) {
    const value = nutriments[key];
    if (typeof value === 'number') {
      values[field] = Math.round(value * 10) / 10;
    }
  }
  if (Object.keys(values).length === 0) {
    return undefined;
  }
  const liquid = /\d\s*(ml|cl|dl|l)\b/i.test(quantity ?? '');
  // Values outside the plausible range (typos in the database) make the whole block unusable.
  const parsed = NutritionSchema.safeParse({
    basis: liquid ? '100ml' : '100g',
    ...values,
    source: 'off',
  });
  return parsed.success ? parsed.data : undefined;
}

/** Turns an Open Food Facts API answer into `ProductInfo`, or null if it names no product. */
export function parseOffProduct(json: unknown, gtin: Gtin): ProductInfo | null {
  const parsed = OffResponseSchema.safeParse(json);
  const product = parsed.success ? parsed.data.product : undefined;
  if (product === undefined) {
    return null;
  }
  const name =
    text(product.product_name_de, 120) ??
    text(product.product_name, 120) ??
    text(product.generic_name_de, 120);
  if (name === undefined) {
    return null;
  }
  const brand = text(product.brands?.split(',')[0], 80);
  const packSize = text(product.quantity, 30);
  const nutrition = nutritionOf(product.nutriments, product.quantity);
  const grade = product.nutriscore_grade?.toLowerCase();
  const nutriScore = z.enum(['a', 'b', 'c', 'd', 'e']).safeParse(grade).data;
  const allergens = (product.allergens_tags ?? [])
    .map(untag)
    .filter((tag) => /^[a-z][a-z0-9-]{1,40}$/.test(tag))
    .slice(0, 20);
  const categoryHints = (product.categories_tags ?? []).map(untag).slice(0, 20);
  return {
    gtin,
    name,
    source: 'off',
    ...(brand === undefined ? {} : { brand }),
    ...(packSize === undefined ? {} : { packSize }),
    ...(categoryHints.length === 0 ? {} : { categoryHints }),
    ...(nutrition === undefined ? {} : { nutrition }),
    ...(nutriScore === undefined ? {} : { nutriScore }),
    ...(allergens.length === 0 ? {} : { allergens }),
  };
}
