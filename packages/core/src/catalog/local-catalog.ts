import { z } from 'zod';
import { GtinSchema, type Gtin } from '../model/primitives';
import type { ProductSearch, ProductSearchHit } from '../ports';
import { normalizeFoodText } from './match';

/**
 * One product of a catalog file the app ships (ADR-0045): `[id, name, brand, size, hints, shops]`.
 * The id is a barcode for Open Food Facts rows, a shop number (`aldi:…`) for shop websites.
 */
const RowSchema = z.tuple([
  z.string(),
  z.string().min(1).max(120),
  z.string().max(80).nullable(),
  z.string().max(30).nullable(),
  z.array(z.string()),
  z.array(z.string()),
]);
const FileSchema = z.object({ products: z.array(z.unknown()) });

export interface CatalogProduct {
  gtin?: Gtin;
  name: string;
  brand?: string;
  packSize?: string;
  /** Category hints of the source («yogurts», «Milchprodukte & Eier»). */
  hints: readonly string[];
  /** Shops that sell it («migros», «coop», «aldi»). */
  shops: readonly string[];
}

/** Reads a catalog file defensively: a broken file is an empty catalog, a broken row is skipped. */
export function parseCatalogFile(json: unknown): CatalogProduct[] {
  const file = FileSchema.safeParse(json);
  if (!file.success) {
    return [];
  }
  return file.data.products.flatMap((raw) => {
    const row = RowSchema.safeParse(raw);
    if (!row.success) {
      return [];
    }
    const [id, name, brand, size, hints, shops] = row.data;
    const gtin = GtinSchema.safeParse(id);
    return [
      {
        ...(gtin.success ? { gtin: gtin.data } : {}),
        name,
        ...(brand === null ? {} : { brand }),
        ...(size === null ? {} : { packSize: size }),
        hints,
        shops,
      },
    ];
  });
}

/** A word of the query found in the product: the same word, or a compound that ends with it. */
const fits = (word: string, words: readonly string[]) =>
  words.some((candidate) => candidate === word || (word.length >= 4 && candidate.endsWith(word)));

/**
 * Name search in the shipped catalog, on the device (ADR-0045): nothing leaves the phone. Returns
 * the products with a barcode that share the most words with the query; `rankReceiptHits` then
 * decides whether one is good enough.
 */
export function localCatalogSearch(products: readonly CatalogProduct[]): ProductSearch {
  const indexed = products.flatMap((product) =>
    product.gtin === undefined
      ? []
      : [
          {
            hit: {
              gtin: product.gtin,
              name: product.name,
              ...(product.brand === undefined ? {} : { brand: product.brand }),
              ...(product.packSize === undefined ? {} : { packSize: product.packSize }),
            } satisfies ProductSearchHit,
            words: normalizeFoodText(`${product.name} ${product.brand ?? ''}`).split(' '),
          },
        ],
  );
  return {
    searchByName(query, limit) {
      const wanted = normalizeFoodText(query)
        .split(' ')
        .filter((word) => word.length >= 2);
      const hits = indexed
        .map((entry) => ({
          hit: entry.hit,
          shared: wanted.filter((word) => fits(word, entry.words)).length,
        }))
        .filter((entry) => entry.shared > 0)
        .sort((a, b) => b.shared - a.shared)
        .slice(0, limit)
        .map((entry) => entry.hit);
      return Promise.resolve(hits);
    },
  };
}
