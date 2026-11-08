import { localCatalogSearch, parseCatalogFile, type ProductSearch } from '@fridgeai/core';

/** The catalog file built from Open Food Facts (ADR-0045), served with the app, never a CDN. */
export const CATALOG_URL = `${import.meta.env.BASE_URL}catalog/off-ch.json`;

type Load = () => Promise<Response>;

/**
 * The shipped catalog as a name search on the device. The file (about 90 kB packed) is fetched
 * on the first search only and then kept in memory; the service worker keeps it for offline use.
 * When it cannot be loaded, the search says `unavailable` and tries again next time.
 */
export function shippedCatalogSearch(
  load: Load = () => fetch(CATALOG_URL, { credentials: 'omit' }),
): ProductSearch {
  let ready: Promise<ProductSearch | null> | undefined;
  return {
    async searchByName(query, limit) {
      ready ??= load()
        .then((response) => (response.ok ? response.json() : null))
        .then((json: unknown) =>
          json === null ? null : localCatalogSearch(parseCatalogFile(json)),
        )
        .catch(() => null);
      const search = await ready;
      if (search === null) {
        ready = undefined;
        return 'unavailable';
      }
      return search.searchByName(query, limit);
    },
  };
}
