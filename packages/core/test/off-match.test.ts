import { describe, expect, it } from 'vitest';
import {
  createMemoryStorage,
  createReceiptMatchUseCases,
  GtinSchema,
  InventoryItemSchema,
  IsoDateTimeSchema,
  localDate,
  parsePackSize,
  ProductSchema,
  rankReceiptHits,
  ReceiptLineSchema,
  receiptSearchPlan,
  rappen,
  uuidV7,
  type Id,
  type ProductSearch,
  type ProductSearchHit,
} from '../src';

const gtin = (code: string) => GtinSchema.parse(code);
const hit = (code: string, name: string, brand?: string, packSize?: string): ProductSearchHit => ({
  gtin: gtin(code),
  name,
  ...(brand === undefined ? {} : { brand }),
  ...(packSize === undefined ? {} : { packSize }),
});

describe('receiptSearchPlan', () => {
  it('keeps the product words and drops pack sizes and noise', () => {
    expect(receiptSearchPlan('Naturaplan Bio Coconutwater 1L')).toEqual({
      query: 'Naturaplan Bio Coconutwater',
      fallback: 'Coconutwater',
    });
    expect(receiptSearchPlan('Coop Pouletbrust 2St. ca. 330g')).toEqual({
      query: 'Coop Pouletbrust',
      fallback: 'Pouletbrust',
    });
    expect(receiptSearchPlan('M-Budget Vollmilch UHT')).toEqual({
      query: 'M-Budget Vollmilch UHT',
      fallback: 'Vollmilch UHT',
    });
  });

  it('has no fallback without a house brand and gives up on nothing searchable', () => {
    expect(receiptSearchPlan('Guacamole Chunky')).toEqual({ query: 'Guacamole Chunky' });
    expect(receiptSearchPlan('2x 1.5L')).toBeNull();
  });
});

describe('parsePackSize', () => {
  it('reads grams and millilitres in the usual spellings', () => {
    expect(parsePackSize('Joghurt Mocca 180g')).toEqual({ amount: 180, unit: 'g' });
    expect(parsePackSize('75cl')).toEqual({ amount: 750, unit: 'ml' });
    expect(parsePackSize('1,5 l')).toEqual({ amount: 1500, unit: 'ml' });
    expect(parsePackSize('0.5 kg')).toEqual({ amount: 500, unit: 'g' });
    expect(parsePackSize('Bananen')).toBeNull();
  });
});

describe('rankReceiptHits', () => {
  it('is sure when all product words and the pack size fit', () => {
    const best = rankReceiptHits('Coop Naturaplan Joghurt Mocca 180g', [
      hit('7610807000016', 'Joghurt Erdbeer', 'Naturaplan', '180 g'),
      hit('7610807000023', 'Joghurt Mocca', 'Naturaplan', '180 g'),
    ]);
    expect(best).toMatchObject({ hit: { name: 'Joghurt Mocca' }, confidence: 'sure' });
  });

  it('only suggests when the pack size differs', () => {
    const best = rankReceiptHits('Volvic Bio Orange 75cl', [
      hit('3057640000010', 'Volvic Bio Orange', 'Volvic', '1.5 l'),
    ]);
    expect(best?.confidence).toBe('maybe');
  });

  it('finds nothing when the words do not fit', () => {
    expect(rankReceiptHits('Guacamole Chunky', [hit('7610000000011', 'Tomatensauce')])).toBeNull();
    expect(rankReceiptHits('Guacamole Chunky', [])).toBeNull();
  });
});

describe('receipts.matchLine', () => {
  const householdId = id(1);
  const now = IsoDateTimeSchema.parse('2026-11-07T09:00:00.000Z');

  function id(counter: number): Id {
    const random = new Uint8Array(10);
    random[9] = counter;
    return uuidV7(1_762_500_000_000 + counter, random);
  }

  function setup(search?: ProductSearch) {
    const storage = createMemoryStorage();
    let counter = 10;
    const useCases = createReceiptMatchUseCases({
      storage,
      clock: { now: () => now, today: () => localDate('2026-11-07') },
      ids: { next: () => id((counter += 1)) },
      actor: id(2),
      ...(search === undefined ? {} : { search }),
    });
    return { storage, match: useCases['receipts.matchLine'] };
  }

  function recordingSearch(answers: (ProductSearchHit[] | 'unavailable')[]) {
    const queries: string[] = [];
    const search: ProductSearch = {
      searchByName: (query) => {
        queries.push(query);
        return Promise.resolve(answers.shift() ?? []);
      },
    };
    return { search, queries };
  }

  it('searches Open Food Facts with the cleaned words only', async () => {
    const { search, queries } = recordingSearch([
      [hit('7610200000019', 'Vollmilch UHT', 'M-Budget', '1 l')],
    ]);
    const { match } = setup(search);
    const result = await match({ householdId, name: 'M-Budget Vollmilch UHT 1L' });
    expect(queries).toEqual(['M-Budget Vollmilch UHT']);
    expect(result).toMatchObject({
      match: { gtin: '7610200000019', source: 'off', confidence: 'sure' },
      openDatabase: 'searched',
    });
  });

  it('tries once more without the house brand when nothing is found', async () => {
    const { search, queries } = recordingSearch([[], [hit('7610200000026', 'Coconutwater')]]);
    const { match } = setup(search);
    await match({ householdId, name: 'Naturaplan Bio Coconutwater 1L' });
    expect(queries).toEqual(['Naturaplan Bio Coconutwater', 'Coconutwater']);
  });

  it('says when the open database cannot be reached', async () => {
    const { search } = recordingSearch(['unavailable']);
    const { match } = setup(search);
    expect(await match({ householdId, name: 'Guacamole Chunky' })).toEqual({
      openDatabase: 'unavailable',
    });
  });

  it('knows a product from an earlier receipt without asking the network', async () => {
    const { search, queries } = recordingSearch([]);
    const { storage, match } = setup(search);
    const product = ProductSchema.parse({
      id: id(3),
      householdId,
      updatedAt: now,
      name: 'Vollmilch UHT',
      gtin: '7610200000019',
      categoryId: 'dairy-milk',
      defaultLocation: 'fridge',
      source: 'off',
    });
    await storage.products.add(product);
    await storage.receiptLines.add(
      ReceiptLineSchema.parse({
        id: id(4),
        householdId,
        updatedAt: now,
        receiptId: id(5),
        position: 0,
        rawText: 'M-Budget Vollmilch UHT',
        name: 'M-Budget Vollmilch UHT',
        kind: 'item',
        isFood: true,
        quantity: 1,
        unit: 'pcs',
        priceRappen: rappen(125),
        discountRappen: rappen(0),
        assignedTo: 'shared',
        includedInInventory: true,
      }),
    );
    await storage.items.add(
      InventoryItemSchema.parse({
        id: id(6),
        householdId,
        updatedAt: now,
        productId: product.id,
        location: 'fridge',
        quantity: 1,
        unit: 'pcs',
        purchasedAt: now,
        expiresOn: '2026-11-20',
        expiryKind: 'best_before',
        expirySource: 'category_estimate',
        owner: 'shared',
        status: 'eaten',
        receiptLineId: id(4),
      }),
    );
    const result = await match({ householdId, name: 'm-budget vollmilch uht' });
    expect(queries).toEqual([]);
    expect(result).toMatchObject({
      match: { gtin: '7610200000019', source: 'household' },
      openDatabase: 'none',
    });
  });
});
