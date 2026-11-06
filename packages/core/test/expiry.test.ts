import { describe, expect, it } from 'vitest';
import { CategorySchema, isFreezable, shelfLifeAt, type Category } from '../src/catalog/category';
import { localDate } from '../src/dates';
import { estimateExpiry, expiryAfterMove, expiryStatus } from '../src/expiry';

const today = localDate('2026-11-06');

const category = (overrides: Partial<Category>): Category =>
  CategorySchema.parse({
    id: 'test-category',
    name: { de: 'Test' },
    emoji: '🥛',
    group: 'dairy',
    isFood: true,
    dateKind: 'best_before',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 7, freezer: 90, pantry: null },
    defaultOwner: 'shared',
    keywords: ['test'],
    tips: { de: [] },
    ...overrides,
  });

const milk = category({});
const poultry = category({
  id: 'test-poultry',
  group: 'meat',
  dateKind: 'use_by',
  shelfLifeDays: { fridge: 3, freezer: 180, pantry: null },
});
const bread = category({
  id: 'test-bread',
  group: 'bakery',
  defaultLocation: 'pantry',
  shelfLifeDays: { fridge: null, freezer: 90, pantry: 3 },
});
const pasta = category({
  id: 'test-pasta',
  group: 'pantry',
  defaultLocation: 'pantry',
  shelfLifeDays: { fridge: null, freezer: null, pantry: 730 },
});

describe('expiryStatus', () => {
  it.each([
    ['2026-11-20', { kind: 'fresh', daysLeft: 14 }],
    ['2026-11-10', { kind: 'fresh', daysLeft: 4 }],
    ['2026-11-09', { kind: 'soon', daysLeft: 3 }],
    ['2026-11-07', { kind: 'soon', daysLeft: 1 }],
    ['2026-11-06', { kind: 'today' }],
    ['2026-11-04', { kind: 'past_best_before', daysOver: 2 }],
  ])('classifies an MHD of %s', (expiresOn, expected) => {
    expect(expiryStatus(localDate(expiresOn), today, 'best_before')).toEqual(expected);
  });

  it('never calls an expired use-by item «often still good»', () => {
    expect(expiryStatus(localDate('2026-11-05'), today, 'use_by')).toEqual({
      kind: 'past_use_by',
      daysOver: 1,
    });
    expect(expiryStatus(localDate('2026-11-06'), today, 'use_by')).toEqual({ kind: 'today' });
  });

  it('respects a custom «soon» threshold', () => {
    expect(expiryStatus(localDate('2026-11-11'), today, 'best_before', 5)).toEqual({
      kind: 'soon',
      daysLeft: 5,
    });
  });
});

describe('estimateExpiry', () => {
  it('adds the typical shelf life of the location', () => {
    expect(estimateExpiry(milk, 'fridge', today)).toBe('2026-11-13');
    expect(estimateExpiry(milk, 'freezer', today)).toBe('2027-02-04');
    expect(estimateExpiry(milk, 'pantry', today)).toBeNull();
  });
});

describe('expiryAfterMove', () => {
  const current = localDate('2026-11-08');

  it('extends the date when freezing and remembers the day', () => {
    expect(
      expiryAfterMove({
        category: poultry,
        from: 'fridge',
        to: 'freezer',
        today,
        currentExpiresOn: current,
      }),
    ).toEqual({ expiresOn: '2027-05-05', frozenOn: '2026-11-06' });
  });

  it('gives thawed use-by food one day and other food at most two', () => {
    expect(
      expiryAfterMove({
        category: poultry,
        from: 'freezer',
        to: 'fridge',
        today,
        currentExpiresOn: current,
      }),
    ).toEqual({ expiresOn: '2026-11-07' });
    expect(
      expiryAfterMove({
        category: milk,
        from: 'freezer',
        to: 'fridge',
        today,
        currentExpiresOn: current,
      }),
    ).toEqual({ expiresOn: '2026-11-08' });
    expect(
      expiryAfterMove({
        category: bread,
        from: 'freezer',
        to: 'pantry',
        today,
        currentExpiresOn: current,
      }),
    ).toEqual({ expiresOn: '2026-11-08' });
  });

  it('never makes an item last longer by moving it between fridge and pantry', () => {
    const longLasting = localDate('2027-01-01');
    expect(
      expiryAfterMove({
        category: bread,
        from: 'pantry',
        to: 'freezer',
        today,
        currentExpiresOn: current,
      })?.expiresOn,
    ).toBe('2027-02-04');
    const shelfStable = category({
      id: 'test-juice',
      group: 'drinks',
      shelfLifeDays: { fridge: 5, freezer: null, pantry: 180 },
      defaultLocation: 'pantry',
    });
    expect(
      expiryAfterMove({
        category: shelfStable,
        from: 'pantry',
        to: 'fridge',
        today,
        currentExpiresOn: longLasting,
      }),
    ).toEqual({ expiresOn: '2026-11-11' });
    expect(
      expiryAfterMove({
        category: shelfStable,
        from: 'fridge',
        to: 'pantry',
        today,
        currentExpiresOn: current,
      }),
    ).toEqual({ expiresOn: '2026-11-08' });
  });

  it('refuses unsuitable locations and keeps the date when nothing moves', () => {
    expect(
      expiryAfterMove({
        category: pasta,
        from: 'pantry',
        to: 'freezer',
        today,
        currentExpiresOn: current,
      }),
    ).toBeNull();
    expect(
      expiryAfterMove({
        category: milk,
        from: 'fridge',
        to: 'fridge',
        today,
        currentExpiresOn: current,
      }),
    ).toEqual({ expiresOn: current });
  });
});

describe('category schema', () => {
  it('requires a shelf life at the default location and food flags to match', () => {
    expect(() => category({ defaultLocation: 'pantry' })).toThrow();
    expect(() => category({ isFood: false })).toThrow();
    expect(() => category({ isFood: false, group: 'non_food' })).not.toThrow();
  });

  it('tells whether a category can be frozen and how long it keeps', () => {
    expect(isFreezable(milk)).toBe(true);
    expect(isFreezable(pasta)).toBe(false);
    expect(shelfLifeAt(bread, 'pantry')).toBe(3);
    expect(shelfLifeAt(bread, 'fridge')).toBeNull();
  });
});
