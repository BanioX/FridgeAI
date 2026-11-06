import {
  categoryById,
  CONTRACT_V1,
  fallbackCategory,
  matchCategoryByName,
  normalizeFoodText,
  type OperationOutput,
} from '@fridgeai/core';
import type { Handler, HandlerContext } from './command';

type Found = OperationOutput<'products.search'>['products'][number];

/** Every typed word appears in the text («coop gipfeli» finds «Gipfeli», brand «Coop»). */
function matchesAllWords(query: string, text: string): boolean {
  const haystack = ` ${normalizeFoodText(text)} `;
  return normalizeFoodText(query)
    .split(' ')
    .filter((word) => word !== '')
    .every((word) => haystack.includes(word));
}

/**
 * `products.search`: the household's own products first (known names, no network), then the
 * open database. Only the typed words leave the device, and only when the person asks to search.
 */
export function createProductSearchHandler({ db, search }: HandlerContext) {
  const searchProducts: Handler<'products.search'> = async (raw) => {
    const input = CONTRACT_V1['products.search'].input.parse(raw);
    const own: Found[] = (
      await db.products.where('householdId').equals(input.householdId).toArray()
    )
      .filter(
        (product) =>
          product.deletedAt === undefined &&
          matchesAllWords(input.query, `${product.name} ${product.brand ?? ''}`),
      )
      .slice(0, input.limit)
      .map((product) => ({
        name: product.name,
        categoryId: (categoryById(product.categoryId) ?? fallbackCategory()).id,
        source: 'household' as const,
        ...(product.gtin === undefined ? {} : { gtin: product.gtin }),
        ...(product.brand === undefined ? {} : { brand: product.brand }),
        ...(product.packSize === undefined ? {} : { packSize: product.packSize }),
      }));
    if (search === undefined || input.scope === 'household') {
      return { products: own, openDatabase: 'none' };
    }
    const hits = await search.searchByName(input.query, input.limit);
    if (hits === 'unavailable') {
      return { products: own, openDatabase: 'unavailable' };
    }
    const known = new Set(own.map((product) => product.gtin));
    const found: Found[] = hits
      .filter((hit) => !known.has(hit.gtin))
      .map((hit) => ({
        ...hit,
        categoryId: (matchCategoryByName(hit.name) ?? fallbackCategory()).id,
        source: 'off' as const,
      }));
    return { products: [...own, ...found].slice(0, input.limit), openDatabase: 'searched' };
  };
  return { 'products.search': searchProducts };
}
