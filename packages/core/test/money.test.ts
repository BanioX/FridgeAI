import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  allocate,
  formatChf,
  parseChf,
  rappen,
  RappenSchema,
  splitEvenly,
  sumRappen,
  type Rappen,
} from '../src/money';

const r = (value: number): Rappen => rappen(value);

describe('rappen', () => {
  it('accepts safe integers and rejects everything else', () => {
    expect(rappen(395)).toBe(395);
    expect(rappen(-80)).toBe(-80);
    expect(() => rappen(3.95)).toThrow(RangeError);
    expect(() => rappen(Number.NaN)).toThrow(RangeError);
    expect(() => rappen(2 ** 53)).toThrow(RangeError);
  });

  it('validates through the Zod schema', () => {
    expect(RappenSchema.safeParse(395).success).toBe(true);
    expect(RappenSchema.safeParse(3.95).success).toBe(false);
    expect(RappenSchema.safeParse('395').success).toBe(false);
  });

  it('sums without floating point drift', () => {
    expect(sumRappen([r(10), r(20), r(-5)])).toBe(25);
    expect(sumRappen([])).toBe(0);
  });
});

describe('parseChf', () => {
  it.each([
    ['3.95', 395],
    ['3,95', 395],
    ['3.9', 390],
    ['12', 1200],
    ['0.05', 5],
    ['.95', 95],
    ['-.95', -95],
    ['-0.80', -80],
    ['0.80-', -80],
    ['−3.95', -395],
    ["1'234.50", 123450],
    ['1’234.50', 123450],
    ['1 234.50', 123450],
    ["1'234'567.00", 123456700],
    ['CHF 12.–', 1200],
    ['12.-', 1200],
    ['CHF 3.95', 395],
    ['Fr. 3.95', 395],
    ['3.95 CHF', 395],
    ['CHF -3.95', -395],
    ['-CHF 3.95', -395],
    ['  7.50  ', 750],
    ['-0.00', 0],
  ])('parses %j as %i Rappen', (input, expected) => {
    expect(parseChf(input)).toBe(expected);
  });

  it.each([
    '',
    'abc',
    '3.955',
    '1.2.3',
    '12.',
    '--3',
    'CHF',
    '1,234.50',
    '3.95.',
    'CHF CHF 3',
    '99999999999999999',
  ])('rejects %j', (input) => {
    expect(parseChf(input)).toBeNull();
  });

  it('round-trips with formatChf for any amount', () => {
    fc.assert(
      fc.property(fc.integer({ min: -10_000_000_000, max: 10_000_000_000 }), (value) => {
        const amount = r(value);
        expect(parseChf(formatChf(amount))).toBe(amount === 0 ? 0 : amount);
        expect(parseChf(formatChf(amount, { currency: false }))).toBe(amount === 0 ? 0 : amount);
      }),
    );
  });
});

describe('formatChf', () => {
  it.each([
    [395, 'CHF 3.95'],
    [5, 'CHF 0.05'],
    [0, 'CHF 0.00'],
    [-395, 'CHF -3.95'],
    [123450, 'CHF 1’234.50'],
    [123456700, 'CHF 1’234’567.00'],
  ])('formats %i as %s', (input, expected) => {
    expect(formatChf(r(input))).toBe(expected);
  });

  it('can omit the currency', () => {
    expect(formatChf(r(1250), { currency: false })).toBe('12.50');
  });
});

describe('allocate', () => {
  it('splits by weights with the largest remainder method', () => {
    expect(allocate(r(1000), [1, 1, 1])).toEqual([334, 333, 333]);
    expect(allocate(r(100), [1, 2, 1])).toEqual([25, 50, 25]);
    expect(allocate(r(-1000), [1, 1, 1])).toEqual([-334, -333, -333]);
    expect(allocate(r(5), [0, 1, 0])).toEqual([0, 5, 0]);
    expect(allocate(r(0), [1, 1])).toEqual([0, 0]);
  });

  it('rotates who receives the leftover Rappen with offset', () => {
    expect(splitEvenly(r(1000), 3, { offset: 0 })).toEqual([334, 333, 333]);
    expect(splitEvenly(r(1000), 3, { offset: 1 })).toEqual([333, 334, 333]);
    expect(splitEvenly(r(1000), 3, { offset: 2 })).toEqual([333, 333, 334]);
    expect(splitEvenly(r(1000), 3, { offset: 5 })).toEqual([333, 333, 334]);
    expect(splitEvenly(r(1000), 3, { offset: -1 })).toEqual([333, 333, 334]);
  });

  it('rejects invalid input', () => {
    expect(() => allocate(r(100), [])).toThrow(RangeError);
    expect(() => allocate(r(100), [0, 0])).toThrow(RangeError);
    expect(() => allocate(r(100), [1, -1])).toThrow(RangeError);
    expect(() => allocate(r(100), [1.5])).toThrow(RangeError);
    expect(() => allocate(r(2 ** 40), [2 ** 20])).toThrow(RangeError);
    expect(() => splitEvenly(r(100), 0)).toThrow(RangeError);
  });

  const allocationInput = fc.record({
    total: fc.integer({ min: -10_000_000, max: 10_000_000 }),
    weights: fc
      .array(fc.integer({ min: 0, max: 100_000 }), { minLength: 1, maxLength: 12 })
      .filter((weights) => weights.some((weight) => weight > 0)),
    offset: fc.integer({ min: -20, max: 20 }),
  });

  it('never loses or creates a Rappen', () => {
    fc.assert(
      fc.property(allocationInput, ({ total, weights, offset }) => {
        const shares = allocate(r(total), weights, { offset });
        expect(shares.reduce((sum, share) => sum + share, 0)).toBe(total);
      }),
    );
  });

  it('keeps every share within one Rappen of its exact value', () => {
    fc.assert(
      fc.property(allocationInput, ({ total, weights, offset }) => {
        const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
        const shares = allocate(r(total), weights, { offset });
        shares.forEach((share, index) => {
          const exact = (total * (weights[index] ?? 0)) / weightSum;
          expect(Math.abs(share - exact)).toBeLessThan(1);
          if (weights[index] === 0) {
            expect(share).toBe(0);
          }
        });
      }),
    );
  });

  it('is symmetric for negative totals', () => {
    fc.assert(
      fc.property(allocationInput, ({ total, weights, offset }) => {
        const positive = allocate(r(Math.abs(total)), weights, { offset });
        const negative = allocate(r(-Math.abs(total)), weights, { offset });
        expect(negative).toEqual(positive.map((share) => (share === 0 ? 0 : 0 - share)));
      }),
    );
  });
});
