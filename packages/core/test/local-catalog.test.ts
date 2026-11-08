import { describe, expect, it } from 'vitest';
import {
  createMemoryStorage,
  createReceiptMatchUseCases,
  IsoDateTimeSchema,
  localCatalogSearch,
  localDate,
  parseCatalogFile,
  uuidV7,
  type Id,
  type ProductSearch,
} from '../src';

const file = {
  built: '2026-11-08',
  products: [
    ['7613404169025', 'Joghurt Erdbeer', 'Migros', '180 g', ['yogurts'], ['migros']],
    ['7610200000019', 'Vollmilch UHT', 'M-Budget', '1 l', ['milks'], ['migros']],
    ['aldi:000000000000106896', 'Holländischer Gouda', 'MILSANI', '450 g', [], ['aldi']],
    ['not-a-row'],
    ['123', '', null, null, [], []],
  ],
};

describe('parseCatalogFile (ADR-0045)', () => {
  it('reads valid rows, keeps barcodes only where they are valid and skips broken rows', () => {
    const products = parseCatalogFile(file);
    expect(products).toHaveLength(3);
    expect(products[0]).toEqual({
      gtin: '7613404169025',
      name: 'Joghurt Erdbeer',
      brand: 'Migros',
      packSize: '180 g',
      hints: ['yogurts'],
      shops: ['migros'],
    });
    expect(products[2]?.gtin).toBeUndefined();
    expect(parseCatalogFile(null)).toEqual([]);
    expect(parseCatalogFile({ products: 'x' })).toEqual([]);
  });
});

describe('localCatalogSearch', () => {
  const search = localCatalogSearch(parseCatalogFile(file));

  it('finds products with a barcode by their words, the best first', async () => {
    expect(await search.searchByName('Vollmilch UHT', 5)).toEqual([
      { gtin: '7610200000019', name: 'Vollmilch UHT', brand: 'M-Budget', packSize: '1 l' },
    ]);
    expect(await search.searchByName('Joghurt', 5)).toHaveLength(1);
  });

  it('leaves out products without a barcode and finds nothing for unknown words', async () => {
    expect(await search.searchByName('Gouda', 5)).toEqual([]);
    expect(await search.searchByName('Kirschen', 5)).toEqual([]);
  });
});

describe('receipts.matchLine with the shipped catalog', () => {
  const householdId = uuidV7(1_762_500_000_001, new Uint8Array(10));
  const now = IsoDateTimeSchema.parse('2026-11-08T09:00:00.000Z');

  function setup(search?: ProductSearch) {
    let counter = 10;
    const queries: string[] = [];
    const network: ProductSearch = {
      searchByName: (query) => {
        queries.push(query);
        return search === undefined ? Promise.resolve([]) : search.searchByName(query, 8);
      },
    };
    const useCases = createReceiptMatchUseCases({
      storage: createMemoryStorage(),
      clock: { now: () => now, today: () => localDate('2026-11-08') },
      ids: { next: (): Id => uuidV7(1_762_500_000_000 + (counter += 1), new Uint8Array(10)) },
      actor: householdId,
      search: network,
      localSearch: localCatalogSearch(parseCatalogFile(file)),
    });
    return { match: useCases['receipts.matchLine'], queries };
  }

  it('takes a sure hit from the device and sends no name over the network', async () => {
    const { match, queries } = setup();
    const result = await match({ householdId, name: 'M-Budget Vollmilch UHT 1L' });
    expect(result).toEqual({
      match: {
        gtin: '7610200000019',
        name: 'Vollmilch UHT',
        brand: 'M-Budget',
        packSize: '1 l',
        source: 'catalog',
        confidence: 'sure',
      },
      openDatabase: 'none',
    });
    expect(queries).toEqual([]);
  });

  it('asks Open Food Facts when the catalog has no sure hit', async () => {
    const { match, queries } = setup();
    const result = await match({ householdId, name: 'Guacamole Chunky' });
    expect(queries).not.toEqual([]);
    expect(result).toEqual({ openDatabase: 'searched' });
  });
});
