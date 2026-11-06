import {
  offProductUrl,
  offSearchUrl,
  parseOffProduct,
  parseOffSearch,
  type ProductCatalog,
  type ProductSearch,
} from '@fridgeai/core';

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Open Food Facts adapter (ADR-0016): sends only the barcode number, gives up after a few seconds
 * and treats every failure (offline, not found, broken answer) as «unknown product», so scanning
 * never blocks on the network.
 */
export function openFoodFactsCatalog(
  fetchJson: Fetch = (url, init) => fetch(url, init),
  timeoutMs = 6000,
): ProductCatalog {
  return {
    async lookupByGtin(gtin) {
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, timeoutMs);
      try {
        const response = await fetchJson(offProductUrl(gtin), {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
        });
        return response.ok ? parseOffProduct(await response.json(), gtin) : null;
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

/**
 * Name search on Open Food Facts (Swiss products, all words must match). Sends only the typed
 * words, without cookies or referrer. Everything that is not a clean answer (offline, timeout,
 * «too many searches», broken page) is `unavailable`, so the person can type the product by hand.
 */
export function openFoodFactsSearch(
  fetchJson: Fetch = (url, init) => fetch(url, init),
  timeoutMs = 8000,
): ProductSearch {
  return {
    async searchByName(query, limit) {
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, timeoutMs);
      try {
        const response = await fetchJson(offSearchUrl(query, limit), {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
        });
        if (!response.ok) {
          return 'unavailable';
        }
        return parseOffSearch(await response.json()) ?? 'unavailable';
      } catch {
        return 'unavailable';
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
