import { describe, expect, it } from 'vitest';
import {
  createLabelUseCases,
  createMemoryStorage,
  IsoDateTimeSchema,
  localCatalogSearch,
  localDate,
  parseCatalogFile,
  uuidV7,
  type Id,
  type ProductSearch,
} from '../src';

const file = {
  products: [
    ['7610200000019', 'Bio Vollmilch', 'Naturaplan', '1 l', ['milks'], ['coop']],
    ['7610200000026', 'Vollmilch UHT', 'M-Budget', '1 l', ['milks'], ['migros']],
  ],
};

const householdId = uuidV7(1_762_500_000_001, new Uint8Array(10));

function setup(localSearch?: ProductSearch) {
  return createLabelUseCases({
    storage: createMemoryStorage(),
    clock: {
      now: () => IsoDateTimeSchema.parse('2026-11-12T09:00:00.000Z'),
      today: () => localDate('2026-11-12'),
    },
    ids: { next: (): Id => uuidV7(1_762_500_000_002, new Uint8Array(10)) },
    actor: householdId,
    ...(localSearch === undefined ? {} : { localSearch }),
  })['products.fromLabel'];
}

describe('products.fromLabel (ADR-0068)', () => {
  it('reads the label and suggests catalogue products, on the device', async () => {
    const fromLabel = setup(localCatalogSearch(parseCatalogFile(file)));
    const result = await fromLabel({
      householdId,
      text: 'Naturaplan\nBio Vollmilch\n1 l\nMindestens haltbar bis 20.11.2026',
    });
    expect(result).toEqual({
      expiresOn: '2026-11-20',
      expiryKind: 'best_before',
      amount: { quantity: 1000, unit: 'ml' },
      categoryId: 'dairy-milk',
      suggestions: [
        { gtin: '7610200000019', name: 'Bio Vollmilch', brand: 'Naturaplan', packSize: '1 l' },
      ],
    });
  });

  it('still reads date and amount when the catalogue is missing or unreachable', async () => {
    const offline = setup({ searchByName: () => Promise.resolve('unavailable') });
    expect(await offline({ householdId, text: 'Rahm 2,5 dl' })).toEqual({
      amount: { quantity: 250, unit: 'ml' },
      categoryId: 'dairy-cream',
      suggestions: [],
    });
    expect(await setup()({ householdId, text: '' })).toEqual({ suggestions: [] });
  });
});
