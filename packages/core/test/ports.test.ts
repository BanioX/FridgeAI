import { describe, expect, it } from 'vitest';
import { IsoDateTimeSchema, type Gtin } from '../src/model';
import { chainCatalogs, type ProductCatalog, type ProductInfo } from '../src/ports';
import {
  inMemoryCatalog,
  MOCK_PARTNER_ID,
  mockDeliveryProvider,
  mockRebuyProvider,
  mockRetailerReceiptSource,
} from '../src/ports/mocks';

const milk: ProductInfo = {
  gtin: '7610000000015' as Gtin,
  name: 'Vollmilch',
  source: 'off',
  nutrition: { basis: '100ml', energyKcal: 64, source: 'off' },
};
const repoMilk: ProductInfo = {
  ...milk,
  name: 'Vollmilch (Open Food Repo)',
  source: 'openfoodrepo',
};
const yoghurt: ProductInfo = {
  gtin: '7610000000022' as Gtin,
  name: 'Joghurt',
  source: 'openfoodrepo',
};

describe('chainCatalogs', () => {
  it('returns the first hit in order and falls through on misses', async () => {
    const calls: string[] = [];
    const tracked = (name: string, catalog: ProductCatalog): ProductCatalog => ({
      lookupByGtin: (gtin) => {
        calls.push(name);
        return catalog.lookupByGtin(gtin);
      },
    });
    const chain = chainCatalogs([
      tracked('cache', inMemoryCatalog([])),
      tracked('off', inMemoryCatalog([milk])),
      tracked('repo', inMemoryCatalog([repoMilk, yoghurt])),
    ]);
    expect((await chain.lookupByGtin(milk.gtin))?.name).toBe('Vollmilch');
    expect(calls).toEqual(['cache', 'off']);
    expect((await chain.lookupByGtin(yoghurt.gtin))?.source).toBe('openfoodrepo');
    expect(await chain.lookupByGtin('4006381333931' as Gtin)).toBeNull();
    expect(await chainCatalogs([]).lookupByGtin(milk.gtin)).toBeNull();
  });
});

describe('partner mocks', () => {
  it('are clearly fake and never point to real services', async () => {
    const offers = await mockRebuyProvider.offers([{ name: 'Milch' }, { name: 'Eier' }]);
    expect(offers).toHaveLength(2);
    for (const offer of offers) {
      expect(offer.partnerId).toBe(MOCK_PARTNER_ID);
      expect(offer.url).toMatch(/^https:\/\/example\.invalid\//);
    }
    const basket = await mockDeliveryProvider.createBasket([{ name: 'Milch', quantity: 1 }]);
    expect(basket.checkoutUrl).toMatch(/example\.invalid/);
    expect(
      await mockRetailerReceiptSource.receiptsSince(
        IsoDateTimeSchema.parse('2026-11-01T00:00:00.000Z'),
      ),
    ).toEqual([]);
  });
});
