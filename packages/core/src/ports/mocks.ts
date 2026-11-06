import { rappen } from '../money';
import type {
  DeliveryProvider,
  ProductCatalog,
  ProductInfo,
  RebuyProvider,
  RetailerReceiptSource,
} from './index';

/**
 * Mock partners (CLAUDE.md: no real partner integrations). They are deterministic,
 * clearly fake (`partnerId: 'mock'`, `example.invalid` URLs) and never contact the network.
 */
export const MOCK_PARTNER_ID = 'mock';

export const mockRebuyProvider: RebuyProvider = {
  offers: (items) =>
    Promise.resolve(
      items.map((item, index) => ({
        partnerId: MOCK_PARTNER_ID,
        title: item.name,
        priceRappen: rappen(0),
        url: `https://example.invalid/rebuy/${String(index)}`,
      })),
    ),
};

export const mockDeliveryProvider: DeliveryProvider = {
  createBasket: () =>
    Promise.resolve({ partnerId: MOCK_PARTNER_ID, checkoutUrl: 'https://example.invalid/basket' }),
};

export const mockRetailerReceiptSource: RetailerReceiptSource = {
  receiptsSince: () => Promise.resolve([]),
};

/** In-memory catalog for tests and offline demos. */
export function inMemoryCatalog(products: readonly ProductInfo[]): ProductCatalog {
  const byGtin = new Map(products.map((product) => [product.gtin, product]));
  return { lookupByGtin: (gtin) => Promise.resolve(byGtin.get(gtin) ?? null) };
}
