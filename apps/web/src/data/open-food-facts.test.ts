import { GtinSchema } from '@fridgeai/core';
import { describe, expect, it, vi } from 'vitest';
import { openFoodFactsCatalog, openFoodFactsSearch, rateLimitedSearch } from './open-food-facts';

const gtin = GtinSchema.parse('7610000000004');
const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('openFoodFactsCatalog', () => {
  it('sends only the barcode, without cookies or referrer, and parses the product', async () => {
    const fetchJson = vi.fn(() => json({ product: { product_name_de: 'Vollmilch' } }));
    const found = await openFoodFactsCatalog(fetchJson).lookupByGtin(gtin);
    expect(found).toEqual({ gtin, name: 'Vollmilch', source: 'off' });
    expect(fetchJson).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/product/7610000000004.json?fields='),
      expect.objectContaining({ credentials: 'omit', referrerPolicy: 'no-referrer' }),
    );
  });

  it('treats not found, errors and offline as an unknown product', async () => {
    const catalog = (fetchJson: () => Promise<Response>) => openFoodFactsCatalog(fetchJson);
    expect(await catalog(() => json({ status: 0 }, 404)).lookupByGtin(gtin)).toBeNull();
    expect(
      await catalog(() => Promise.reject(new TypeError('offline'))).lookupByGtin(gtin),
    ).toBeNull();
    expect(
      await catalog(() => Promise.resolve(new Response('<html>'))).lookupByGtin(gtin),
    ).toBeNull();
  });

  it('gives up after the timeout', async () => {
    const hanging = (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      });
    expect(await openFoodFactsCatalog(hanging, 10).lookupByGtin(gtin)).toBeNull();
  });
});

describe('openFoodFactsSearch', () => {
  it('sends only the words, without cookies or referrer, and returns the hits', async () => {
    const fetchJson = vi.fn(() =>
      json({ products: [{ code: '7610000000004', product_name_de: 'Gipfeli', brands: 'Coop' }] }),
    );
    expect(await openFoodFactsSearch(fetchJson).searchByName('coop gipfeli', 8)).toEqual([
      { gtin, name: 'Gipfeli', brand: 'Coop' },
    ]);
    expect(fetchJson).toHaveBeenCalledWith(
      expect.stringContaining('search_terms=coop%20gipfeli'),
      expect.objectContaining({ credentials: 'omit', referrerPolicy: 'no-referrer' }),
    );
  });

  it('is unavailable when offline, rate limited or broken', async () => {
    const search = (fetchJson: () => Promise<Response>) =>
      openFoodFactsSearch(fetchJson).searchByName('weggli', 8);
    expect(await search(() => json({}, 429))).toBe('unavailable');
    expect(await search(() => Promise.resolve(new Response('<html>')))).toBe('unavailable');
    expect(await search(() => Promise.reject(new TypeError('offline')))).toBe('unavailable');
  });
});

describe('rateLimitedSearch', () => {
  it('lets a few searches through at once and makes the next one wait for a free slot', async () => {
    let time = 0;
    const waits: number[] = [];
    const sent: string[] = [];
    const search = rateLimitedSearch(
      {
        searchByName: (query) => {
          sent.push(`${String(time)}:${query}`);
          return Promise.resolve([]);
        },
      },
      {
        max: 2,
        windowMs: 60_000,
        now: () => time,
        sleep: (ms) => {
          waits.push(ms);
          time += ms;
          return Promise.resolve();
        },
      },
    );
    await Promise.all(['a', 'b', 'c'].map((query) => search.searchByName(query, 5)));
    expect(sent).toEqual(['0:a', '0:b', '60000:c']);
    expect(waits).toEqual([60_000]);
  });
});
