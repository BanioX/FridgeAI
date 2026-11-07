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

/**
 * Open Food Facts allows about 10 searches a minute. Matching a receipt asks line by line, so
 * the searches wait for a free slot instead of being refused (ADR-0036). Shared by the name
 * search and the receipt matching.
 */
export function rateLimitedSearch(
  search: ProductSearch,
  { max = 8, windowMs = 60_000, now = () => Date.now(), sleep = wait } = {},
): ProductSearch {
  const recent: number[] = [];
  let queue = Promise.resolve();
  async function slot() {
    for (;;) {
      const time = now();
      while (recent.length > 0 && time - (recent[0] ?? 0) >= windowMs) {
        recent.shift();
      }
      if (recent.length < max) {
        recent.push(time);
        return;
      }
      await sleep(windowMs - (time - (recent[0] ?? time)));
    }
  }
  return {
    searchByName(query, limit) {
      const turn = queue.then(slot);
      queue = turn.catch(() => undefined);
      return turn.then(() => search.searchByName(query, limit));
    },
  };
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, Math.max(0, ms));
  });
}
