import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/catalog/categories';
import { CategorySchema, shelfLifeAt } from '../src/catalog/category';
import { addMonths, addYears, localDate, parseDateInput } from '../src/dates';
import {
  estimateExpiry,
  expiryPresets,
  expiryStatus,
  RESERVE_SOON_THRESHOLD_DAYS,
  soonThresholdFor,
} from '../src/expiry';
import { StorageLocationSchema } from '../src/model';
import { parseScannedCode } from '../src/scan/gs1';

const today = localDate('2026-11-06');
const byId = (id: string) => {
  const category = CATEGORIES.find((candidate) => candidate.id === id);
  if (category === undefined) {
    throw new Error(`missing category ${id}`);
  }
  return category;
};

describe('Notvorrat as a storage location', () => {
  it('is the fourth storage location', () => {
    expect(StorageLocationSchema.options).toEqual(['fridge', 'freezer', 'pantry', 'reserve']);
  });

  it('accepts long-lasting pantry food with its pantry shelf life, not fresh food', () => {
    expect(shelfLifeAt(byId('pantry-rice'), 'reserve')).toBe(730);
    expect(shelfLifeAt(byId('pantry-canned'), 'reserve')).toBe(730);
    expect(shelfLifeAt(byId('bakery-bread'), 'reserve')).toBeNull();
    expect(shelfLifeAt(byId('dairy-milk'), 'reserve')).toBeNull();
  });

  it('has emergency categories with decades of shelf life', () => {
    const reserve = CATEGORIES.filter((category) => category.group === 'reserve');
    expect(reserve.map((category) => category.id)).toEqual([
      'reserve-freeze-dried',
      'reserve-rations',
      'reserve-water',
    ]);
    expect(estimateExpiry(byId('reserve-freeze-dried'), 'reserve', today)).toBe('2051-10-31'); // 9125 days incl. 6 leap days
    expect(byId('reserve-water').tips.de.join(' ')).toContain('9 Liter');
  });

  it('allows shelf lives up to 100 years', () => {
    const base = byId('reserve-freeze-dried');
    const fifty = { ...base, shelfLifeDays: { ...base.shelfLifeDays, reserve: 50 * 365 } };
    expect(CategorySchema.safeParse(fifty).success).toBe(true);
    const tooLong = { ...base, shelfLifeDays: { ...base.shelfLifeDays, reserve: 40_000 } };
    expect(CategorySchema.safeParse(tooLong).success).toBe(false);
  });

  it('warns months ahead instead of days', () => {
    expect(soonThresholdFor('fridge')).toBe(3);
    expect(soonThresholdFor('reserve')).toBe(RESERVE_SOON_THRESHOLD_DAYS);
    const inTwoMonths = addMonths(today, 2);
    expect(expiryStatus(inTwoMonths, today, 'best_before', soonThresholdFor('reserve')).kind).toBe(
      'soon',
    );
    expect(expiryStatus(inTwoMonths, today, 'best_before', soonThresholdFor('pantry')).kind).toBe(
      'fresh',
    );
  });

  it('reads 50-year dates from typed input and GS1 codes', () => {
    expect(parseDateInput('12.2076', today)).toBe('2076-12-31');
    expect(parseDateInput('01.06.2076', today)).toBe('2076-06-01');
    expect(parseScannedCode('(01)09506000134352(15)760601', today)?.data.bestBefore).toBe(
      '2076-06-01',
    );
  });
});

describe('addMonths / addYears', () => {
  it.each([
    ['2026-01-31', 1, '2026-02-28'],
    ['2028-01-31', 1, '2028-02-29'],
    ['2026-11-06', 2, '2027-01-06'],
    ['2026-03-31', -1, '2026-02-28'],
    ['2026-11-06', -11, '2025-12-06'],
  ])('%s + %i months = %s', (start, months, expected) => {
    expect(addMonths(localDate(start), months)).toBe(expected);
  });

  it('adds years and clamps leap days', () => {
    expect(addYears(localDate('2028-02-29'), 1)).toBe('2029-02-28');
    expect(addYears(today, 50)).toBe('2076-11-06');
    expect(() => addMonths(today, 1.5)).toThrow(RangeError);
  });
});

describe('expiryPresets', () => {
  const amounts = (presets: ReturnType<typeof expiryPresets>) =>
    presets.map((preset) => `${String(preset.amount)}${preset.unit[0] ?? ''}`);

  it('offers days for the fridge', () => {
    const presets = expiryPresets('fridge', today, 7);
    expect(amounts(presets)).toEqual(['1d', '2d', '3d', '1w', '2w']);
    expect(presets[0]?.date).toBe('2026-11-07');
  });

  it('offers months for the freezer and medium-life food', () => {
    expect(amounts(expiryPresets('freezer', today, 90))).toEqual(['1w', '1m', '3m', '6m', '1y']);
    expect(amounts(expiryPresets('fridge', today, 45))).toEqual(['1w', '1m', '3m', '6m', '1y']);
  });

  it('offers years for long-life pantry food and decades for the Notvorrat', () => {
    expect(amounts(expiryPresets('pantry', today, 730))).toEqual(['6m', '1y', '2y', '3y', '5y']);
    const reserve = expiryPresets('reserve', today, 9125);
    expect(amounts(reserve)).toEqual(['1y', '5y', '10y', '25y', '50y']);
    expect(reserve.at(-1)?.date).toBe('2076-11-06');
  });

  it('falls back to short presets without a typical shelf life', () => {
    expect(amounts(expiryPresets('pantry', today))).toEqual(['1d', '2d', '3d', '1w', '2w']);
  });
});
