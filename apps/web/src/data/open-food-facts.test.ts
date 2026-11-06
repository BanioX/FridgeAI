import { GtinSchema } from '@fridgeai/core';
import { describe, expect, it, vi } from 'vitest';
import { openFoodFactsCatalog } from './open-food-facts';

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
