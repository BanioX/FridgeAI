import { describe, expect, it } from 'vitest';
import {
  addDays,
  localDate,
  restockSuggestions,
  uuidV7,
  type Id,
  type RestockInput,
  type RestockSuggestion,
} from '../src';

function id(counter: number): Id {
  const random = new Uint8Array(10);
  random[9] = counter;
  return uuidV7(1_762_500_000_000 + counter, random);
}

const milk = id(1);
const bread = id(2);
const today = localDate('2026-11-13');

/** Purchases of one product on the given days of November 2026 (noon, so the Zurich day matches). */
const bought = (productId: Id, ...days: number[]) =>
  days.map((day) => ({
    productId,
    purchasedAt: `2026-11-${String(day).padStart(2, '0')}T11:00:00.000Z`,
  }));

function run(overrides: Partial<RestockInput> = {}): RestockSuggestion[] {
  return restockSuggestions({
    today,
    products: [{ id: milk, name: 'Vollmilch' }],
    purchases: bought(milk, 1, 4, 7),
    inStockProductIds: [],
    listEntries: [],
    ...overrides,
  });
}

describe('restockSuggestions (ADR-0070)', () => {
  it('suggests a product bought every 3 days when its day has come', () => {
    expect(run()).toEqual([
      { productId: milk, name: 'Vollmilch', everyDays: 3, lastBought: '2026-11-07' },
    ]);
  });

  it('needs three distinct purchase days; several packs on one day count once', () => {
    expect(run({ purchases: bought(milk, 1, 7) })).toEqual([]);
    expect(run({ purchases: bought(milk, 1, 1, 1, 7) })).toEqual([]);
    expect(run({ purchases: bought(milk, 1, 1, 4, 4, 7, 7) })).toHaveLength(1);
  });

  it('takes the median gap, so one long break does not move the rhythm', () => {
    // Gaps 3, 3, 30: median 3.
    const withBreak = run({
      today: localDate('2026-12-31'),
      purchases: [
        ...bought(milk, 1, 4, 7),
        { productId: milk, purchasedAt: '2026-12-07T11:00:00.000Z' },
      ],
    });
    expect(withBreak[0]?.everyDays).toBe(3);
  });

  it('rounds an even median to whole days', () => {
    // Gaps 2 and 5: median 3.5, rounds to 4.
    expect(run({ purchases: bought(milk, 1, 3, 8) })[0]?.everyDays).toBe(4);
  });

  it('knows days by the Zurich calendar, not by UTC', () => {
    // 23:30 UTC on 6.11. is already 7.11. in Zurich.
    const purchases = [
      { productId: milk, purchasedAt: '2026-11-01T11:00:00.000Z' },
      { productId: milk, purchasedAt: '2026-11-04T11:00:00.000Z' },
      { productId: milk, purchasedAt: '2026-11-06T23:30:00.000Z' },
    ];
    expect(run({ purchases })[0]?.lastBought).toBe('2026-11-07');
  });

  it('gives no suggestion for rhythms under 2 or over 60 days', () => {
    expect(run({ purchases: bought(milk, 1, 2, 3) })).toEqual([]);
    const sixtyOne = ['2026-01-01', '2026-03-03', '2026-05-03'].map((day) => ({
      productId: milk,
      purchasedAt: `${day}T11:00:00.000Z`,
    }));
    expect(run({ today: localDate('2026-11-13'), purchases: sixtyOne })).toEqual([]);
    const sixty = ['2026-01-01', '2026-03-02', '2026-04-30'].map((day) => ({
      productId: milk,
      purchasedAt: `${day}T11:00:00.000Z`,
    }));
    expect(run({ purchases: sixty })[0]?.everyDays).toBe(60);
  });

  it('is due from the day before the usual day, not earlier', () => {
    // Last bought 7.11., rhythm 3: usual day 10.11., due from 9.11.
    expect(run({ today: localDate('2026-11-08') })).toEqual([]);
    expect(run({ today: localDate('2026-11-09') })).toHaveLength(1);
    expect(run({ today: localDate('2026-11-10') })).toHaveLength(1);
  });

  it('stays quiet while a pack is in stock', () => {
    expect(run({ inStockProductIds: [milk] })).toEqual([]);
  });

  it('stays quiet when the product is already open on the list, by name or product', () => {
    expect(run({ listEntries: [{ name: ' vollmilch ' }] })).toEqual([]);
    expect(run({ listEntries: [{ name: 'Milch', productId: milk }] })).toEqual([]);
    expect(run({ listEntries: [{ name: 'Brot' }] })).toHaveLength(1);
  });

  it('leaves products with a minimum stock to «Immer da haben»', () => {
    expect(run({ products: [{ id: milk, name: 'Vollmilch', minStock: 1 }] })).toEqual([]);
  });

  it('sorts the most overdue first and shows at most five', () => {
    const ids = [10, 11, 12, 13, 14, 15, 16].map(id);
    const products = ids.map((productId, index) => ({ id: productId, name: `Produkt ${index}` }));
    // Product n was last bought n days ago... the higher n, the more overdue; 3-day rhythm.
    const purchases = ids.flatMap((productId, index) => {
      const last = addDays(today, -(index + 3));
      return [-6, -3, 0].map((offset) => ({
        productId,
        purchasedAt: `${addDays(last, offset)}T11:00:00.000Z`,
      }));
    });
    const suggestions = run({ products, purchases, today: localDate('2026-11-13') });
    expect(suggestions.map((suggestion) => suggestion.name)).toEqual([
      'Produkt 6',
      'Produkt 5',
      'Produkt 4',
      'Produkt 3',
      'Produkt 2',
    ]);
  });

  it('ignores products without any purchase', () => {
    expect(run({ products: [{ id: bread, name: 'Brot' }] })).toEqual([]);
  });
});
