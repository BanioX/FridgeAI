import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { expiryAfterOpening } from '../src/expiry';
import { OutcomeEventSchema } from '../src/model';
import { displayQuantity, knownGrams, portionChoices, toBaseQuantity } from '../src/quantity';
import { CATEGORIES } from '../src/catalog/categories';
import { uuidV7 } from '../src/ids';

describe('quantities', () => {
  it.each([
    [1.5, 'kg', { quantity: 1500, unit: 'g' }],
    [250, 'g', { quantity: 250, unit: 'g' }],
    [3, 'dl', { quantity: 300, unit: 'ml' }],
    [33, 'cl', { quantity: 330, unit: 'ml' }],
    [1.5, 'l', { quantity: 1500, unit: 'ml' }],
    [4, 'pcs', { quantity: 4, unit: 'pcs' }],
  ] as const)('converts %s %s to base units', (amount, unit, expected) => {
    expect(toBaseQuantity(amount, unit)).toEqual(expected);
  });

  it.each([
    [1500, 'g', { amount: 1.5, unit: 'kg' }],
    [250, 'g', { amount: 250, unit: 'g' }],
    [300, 'ml', { amount: 3, unit: 'dl' }],
    [330, 'ml', { amount: 330, unit: 'ml' }],
    [1500, 'ml', { amount: 1.5, unit: 'l' }],
    [2, 'pcs', { amount: 2, unit: 'pcs' }],
    [0.5, 'pcs', { amount: 0.5, unit: 'pcs' }],
  ] as const)('shows %s %s naturally', (quantity, unit, expected) => {
    expect(displayQuantity(quantity, unit)).toEqual(expected);
  });

  it('knows grams for weights, volumes and pieces with a package size', () => {
    expect(knownGrams(250, 'g')).toBe(250);
    expect(knownGrams(500, 'ml')).toBe(500);
    expect(knownGrams(2, 'pcs', { amount: 180, unit: 'g' })).toBe(360);
    expect(knownGrams(2, 'pcs')).toBeUndefined();
  });
});

describe('portionChoices', () => {
  it('offers «1 of 4» for several pieces', () => {
    expect(portionChoices(4, 'pcs').map((c) => [c.kind, c.quantity])).toEqual([
      ['pieces', 1],
      ['pieces', 2],
      ['pieces', 3],
      ['all', 4],
    ]);
  });

  it('offers quarters for grams and a single piece', () => {
    expect(portionChoices(100, 'g').map((c) => [c.kind, c.quantity])).toEqual([
      ['quarter', 25],
      ['half', 50],
      ['three_quarters', 75],
      ['all', 100],
    ]);
    expect(portionChoices(1, 'pcs').map((c) => [c.kind, c.quantity])).toEqual([
      ['quarter', 0.25],
      ['half', 0.5],
      ['three_quarters', 0.75],
      ['all', 1],
    ]);
  });

  it('offers only «all» for tiny amounts', () => {
    expect(portionChoices(10, 'g').map((c) => c.kind)).toEqual(['all']);
    expect(portionChoices(30, 'ml').map((c) => [c.kind, c.quantity])).toEqual([
      ['quarter', 8],
      ['half', 15],
      ['three_quarters', 23],
      ['all', 30],
    ]);
  });
});

describe('expiryAfterOpening', () => {
  const today = localDate('2026-11-06');

  it('shortens the date from today on (Grana Padano until March, 21 days open)', () => {
    expect(
      expiryAfterOpening({
        expiresOn: localDate('2027-03-31'),
        today,
        categoryAfterOpeningDays: 21,
      }),
    ).toEqual({ expiresOn: '2026-11-27', shortened: true });
  });

  it('lets the label override the category and never extends a date', () => {
    expect(
      expiryAfterOpening({
        expiresOn: localDate('2027-03-31'),
        today,
        itemAfterOpeningDays: 3,
        categoryAfterOpeningDays: 21,
      }),
    ).toEqual({ expiresOn: '2026-11-09', shortened: true });
    expect(
      expiryAfterOpening({
        expiresOn: localDate('2026-11-07'),
        today,
        categoryAfterOpeningDays: 3,
      }),
    ).toEqual({ expiresOn: '2026-11-07', shortened: false });
    expect(expiryAfterOpening({ expiresOn: localDate('2027-01-01'), today })).toEqual({
      expiresOn: '2027-01-01',
      shortened: false,
    });
  });

  it('has after-opening values for the categories where it matters', () => {
    const byId = new Map(CATEGORIES.map((category) => [category.id, category]));
    expect(byId.get('dairy-cream')?.afterOpeningDays).toBe(3);
    expect(byId.get('dairy-cheese-hard')?.afterOpeningDays).toBe(21);
    expect(byId.get('pantry-rice')?.afterOpeningDays).toBeUndefined();
  });
});

describe('outcome reasons', () => {
  const id = (n: number) => uuidV7(1_762_441_200_000 + n, new Uint8Array(10).fill(n));
  const base = {
    id: id(1),
    householdId: id(2),
    updatedAt: '2026-11-06T09:00:00.000Z',
    itemId: id(3),
    quantity: 1,
    valueRappen: 100,
    valueEstimated: false,
    owner: 'shared',
    at: '2026-11-06T09:00:00.000Z',
    by: id(4),
  };

  it('accepts a waste reason only for wasted food and a recipient only for shared food', () => {
    expect(
      OutcomeEventSchema.safeParse({ ...base, outcome: 'wasted', wasteReason: 'expired' }).success,
    ).toBe(true);
    expect(
      OutcomeEventSchema.safeParse({ ...base, outcome: 'eaten', wasteReason: 'expired' }).success,
    ).toBe(false);
    expect(
      OutcomeEventSchema.safeParse({ ...base, outcome: 'shared_out', sharedWith: 'neighbor' })
        .success,
    ).toBe(true);
    expect(
      OutcomeEventSchema.safeParse({ ...base, outcome: 'wasted', sharedWith: 'donation' }).success,
    ).toBe(false);
  });
});
