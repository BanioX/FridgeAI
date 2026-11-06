import 'fake-indexeddb/auto';
import { GtinSchema, type Gtin, type ProductCatalog, type ProductInfo } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { cachedCatalog } from './catalog-cache';
import { fixedClock, testDb } from './test-helpers';

const gtin = GtinSchema.parse('7610000000004');
const milk: ProductInfo = { gtin, name: 'Vollmilch', brand: 'Alpenhof', source: 'off' };

function countingCatalog(answer: ProductInfo | null) {
  const asked: Gtin[] = [];
  const catalog: ProductCatalog = {
    lookupByGtin: (code) => {
      asked.push(code);
      return Promise.resolve(answer);
    },
  };
  return { catalog, asked };
}

describe('cachedCatalog', () => {
  it('asks the database once and answers from the cache afterwards', async () => {
    const db = testDb();
    const { catalog, asked } = countingCatalog(milk);
    const cached = cachedCatalog(db, catalog, fixedClock('2026-11-06T09:00:00.000Z'));
    expect(await cached.lookupByGtin(gtin)).toEqual(milk);
    expect(await cached.lookupByGtin(gtin)).toEqual(milk);
    expect(asked).toEqual([gtin]);
    expect(await db.catalogCache.get(gtin)).toMatchObject({
      fetchedAt: '2026-11-06T09:00:00.000Z',
    });
  });

  it('refreshes old answers but keeps them when the database has nothing', async () => {
    const db = testDb();
    await db.catalogCache.put({ gtin, info: milk, fetchedAt: '2026-09-01T09:00:00.000Z' });
    const renamed = { ...milk, name: 'Bio Vollmilch' };
    const fresh = countingCatalog(renamed);
    const clock = fixedClock('2026-11-06T09:00:00.000Z');
    expect(await cachedCatalog(db, fresh.catalog, clock).lookupByGtin(gtin)).toEqual(renamed);
    expect(fresh.asked).toHaveLength(1);

    await db.catalogCache.put({ gtin, info: milk, fetchedAt: '2026-09-01T09:00:00.000Z' });
    const offline = countingCatalog(null);
    expect(await cachedCatalog(db, offline.catalog, clock).lookupByGtin(gtin)).toEqual(milk);
  });

  it('does not remember unknown barcodes', async () => {
    const db = testDb();
    const { catalog, asked } = countingCatalog(null);
    const cached = cachedCatalog(db, catalog, fixedClock());
    expect(await cached.lookupByGtin(gtin)).toBeNull();
    expect(await cached.lookupByGtin(gtin)).toBeNull();
    expect(asked).toHaveLength(2);
    expect(await db.catalogCache.count()).toBe(0);
  });
});
