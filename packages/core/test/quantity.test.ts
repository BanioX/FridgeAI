import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { expiryAfterOpening } from '../src/expiry';
import { OutcomeEventSchema } from '../src/model';
import type { Unit } from '../src/model/primitives';
import {
  displayQuantity,
  fractionsFor,
  halfOf,
  knownGrams,
  portionChoices,
  toBaseQuantity,
  type PortionChoice,
} from '../src/quantity';
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

describe('fractionsFor', () => {
  const show = (splits: number[]) =>
    fractionsFor(splits).map((f) => `${String(f.numerator)}/${String(f.denominator)}`);

  it('merges denominators into distinct fractions in lowest terms, ascending', () => {
    expect(show([3, 4])).toEqual(['1/4', '1/3', '1/2', '2/3', '3/4']);
    expect(show([2, 4])).toEqual(['1/4', '1/2', '3/4']);
  });

  it('adds only the unit fraction for large denominators', () => {
    expect(show([8, 4])).toEqual(['1/8', '1/4', '1/2', '3/4']);
    expect(show([8])).toEqual(['1/8']);
  });

  it('offers nothing without splits (eggs)', () => {
    expect(show([])).toEqual([]);
  });
});

describe('portionChoices', () => {
  const show = (choices: PortionChoice[]) =>
    choices.map((c) =>
      c.kind === 'fraction'
        ? `${String(c.numerator)}/${String(c.denominator)}=${String(c.quantity)}`
        : `${c.kind}=${String(c.quantity)}`,
    );

  it('offers «1 · 2 · 3 Stück» while several pieces are left', () => {
    expect(show(portionChoices(4, 'pcs'))).toEqual(['pieces=1', 'pieces=2', 'pieces=3', 'all=4']);
    // Ten eggs: at most five quick choices, the rest via free input.
    expect(show(portionChoices(10, 'pcs', []))).toEqual([
      'pieces=1',
      'pieces=2',
      'pieces=3',
      'pieces=4',
      'pieces=5',
      'all=10',
    ]);
  });

  it('offers fractions of one piece while less than two are left', () => {
    expect(show(portionChoices(1, 'pcs'))).toEqual(['1/4=0.25', '1/2=0.5', '3/4=0.75', 'all=1']);
    // The rest of a cake (¾ left), cut in eighths and quarters.
    expect(show(portionChoices(0.75, 'pcs', [8, 4]))).toEqual([
      '1/8=0.125',
      '1/4=0.25',
      '1/2=0.5',
      'all=0.75',
    ]);
    // One and a half loaves of bread.
    expect(show(portionChoices(1.5, 'pcs', [2, 4]))).toEqual([
      '1/4=0.25',
      '1/2=0.5',
      '3/4=0.75',
      'pieces=1',
      'all=1.5',
    ]);
  });

  it('offers only «alles» for a single piece that is not split (one egg)', () => {
    expect(show(portionChoices(1, 'pcs', []))).toEqual(['all=1']);
  });

  it('splits grams and millilitres into fractions of what is left', () => {
    expect(show(portionChoices(100, 'g'))).toEqual(['1/4=25', '1/2=50', '3/4=75', 'all=100']);
    // Grana Padano, 300 g, in thirds and quarters.
    expect(show(portionChoices(300, 'g', [3, 4]))).toEqual([
      '1/4=75',
      '1/3=100',
      '1/2=150',
      '2/3=200',
      '3/4=225',
      'all=300',
    ]);
    expect(show(portionChoices(30, 'ml'))).toEqual(['1/4=8', '1/2=15', '3/4=23', 'all=30']);
  });

  it('offers only «alles» for tiny amounts', () => {
    expect(show(portionChoices(10, 'g'))).toEqual(['all=10']);
  });

  it('always ends with «alles» and stays between nothing and everything', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 5000, noNaN: true }),
        fc.constantFrom<Unit>('g', 'ml', 'pcs'),
        fc.subarray([2, 3, 4, 8, 12]),
        (quantity, unit, splits) => {
          const choices = portionChoices(quantity, unit, splits);
          expect(choices.at(-1)).toEqual({ kind: 'all', quantity });
          const amounts = choices.map((choice) => choice.quantity);
          for (const [index, amount] of amounts.entries()) {
            expect(amount).toBeGreaterThan(0);
            expect(amount).toBeLessThanOrEqual(quantity);
            if (index > 0) {
              expect(amount).toBeGreaterThan(amounts[index - 1] ?? 0);
            }
          }
        },
      ),
    );
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

describe('halfOf (fridge check «halb»)', () => {
  it('halves grams and millilitres to whole units', () => {
    expect(halfOf(500, 'g')).toBe(250);
    expect(halfOf(333, 'ml')).toBe(167);
    expect(halfOf(20, 'g')).toBe(10);
  });

  it('halves pieces to a quarter', () => {
    expect(halfOf(4, 'pcs')).toBe(2);
    expect(halfOf(3, 'pcs')).toBe(1.5);
    expect(halfOf(1, 'pcs')).toBe(0.5);
    expect(halfOf(0.75, 'pcs')).toBe(0.25);
    expect(halfOf(0.5, 'pcs')).toBe(0.25);
  });

  it('gives up when there is too little to split', () => {
    expect(halfOf(19, 'g')).toBeNull();
    expect(halfOf(1, 'ml')).toBeNull();
    expect(halfOf(0.25, 'pcs')).toBeNull();
    expect(halfOf(0, 'pcs')).toBeNull();
  });
});
