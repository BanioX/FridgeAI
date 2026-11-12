import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_FOOTPRINT,
  FOOTPRINTS,
  FOOTPRINT_ATTRIBUTION,
  KEHRICHT,
  PIECE_GRAMS,
  categoryById,
  footprintPerKg,
  kehrichtEstimate,
  localDate,
  outcomeWeight,
  summarizeFootprint,
  type FootprintOutcome,
} from '../src';
import { CurrencyCodeSchema } from '../src/currency';
import { IdSchema } from '../src/ids';
import { IsoDateTimeSchema } from '../src/model/primitives';
import { rappen } from '../src/money';

const from = localDate('2026-11-01');
const to = localDate('2026-11-30');
const EUR = CurrencyCodeSchema.parse('EUR');

const outcome = (fields: Partial<FootprintOutcome> = {}): FootprintOutcome => ({
  outcome: 'eaten',
  quantity: 1,
  categoryId: 'dairy-milk',
  at: IsoDateTimeSchema.parse('2026-11-10T09:00:00.000Z'),
  rescued: true,
  ...fields,
});

describe('category mapping', () => {
  it('maps every catalog category, and nothing else', () => {
    expect(Object.keys(CATEGORY_FOOTPRINT).sort()).toEqual(CATEGORIES.map((c) => c.id).sort());
  });

  it('points every mapped entity at a row of the source table', () => {
    for (const [id, mapped] of Object.entries(CATEGORY_FOOTPRINT)) {
      if (mapped.entity !== null) {
        expect(Object.keys(FOOTPRINTS), id).toContain(mapped.entity);
      }
    }
  });

  it('counts no non-food and no water, and marks stand-ins as estimates', () => {
    for (const category of CATEGORIES.filter((c) => !c.isFood)) {
      expect(footprintPerKg(category.id), category.id).toBeUndefined();
    }
    expect(footprintPerKg('reserve-water')).toBeUndefined();
    expect(footprintPerKg('dairy-milk')).toMatchObject({ estimated: false });
    expect(footprintPerKg('dairy-cream')).toMatchObject({ estimated: true });
    expect(footprintPerKg('unknown-category')).toBeUndefined();
  });

  it('uses every table row at least once (no dead data)', () => {
    const used = new Set(Object.values(CATEGORY_FOOTPRINT).map((mapped) => mapped.entity));
    for (const entity of Object.keys(FOOTPRINTS)) {
      expect(used.has(entity as keyof typeof FOOTPRINTS), entity).toBe(true);
    }
  });

  it('carries only positive numbers and the licence line', () => {
    for (const [entity, row] of Object.entries(FOOTPRINTS)) {
      expect(row.ghgKgCo2ePerKg, entity).toBeGreaterThan(0);
      expect(row.waterLitresPerKg, entity).toBeGreaterThan(0);
      expect(row.landM2PerKg, entity).toBeGreaterThan(0);
    }
    expect(FOOTPRINT_ATTRIBUTION).toContain('CC BY 4.0');
  });

  it('has a piece weight only for categories that exist', () => {
    for (const id of Object.keys(PIECE_GRAMS)) {
      expect(categoryById(id), id).toBeDefined();
    }
  });
});

describe('outcomeWeight', () => {
  it('prefers the recorded grams', () => {
    expect(outcomeWeight(outcome({ grams: 750, unit: 'g', quantity: 500 }))).toEqual({
      grams: 750,
      estimated: false,
    });
  });

  it('marks recorded grams of pieces without a package size as an estimate', () => {
    expect(outcomeWeight(outcome({ grams: 1000, unit: 'pcs' })).estimated).toBe(true);
  });

  it('uses quantity and unit, counting millilitres as grams', () => {
    expect(outcomeWeight(outcome({ quantity: 250, unit: 'ml' }))).toEqual({
      grams: 250,
      estimated: false,
    });
    expect(
      outcomeWeight(outcome({ quantity: 2, unit: 'pcs', packageSize: { amount: 180, unit: 'g' } })),
    ).toEqual({ grams: 360, estimated: false });
  });

  it('falls back to the typical piece weight, then the typical pack, then nothing', () => {
    expect(outcomeWeight(outcome({ categoryId: 'dairy-eggs', quantity: 6, unit: 'pcs' }))).toEqual({
      grams: 360,
      estimated: true,
    });
    expect(outcomeWeight(outcome({ categoryId: 'produce-apples', quantity: 3 }))).toEqual({
      grams: 540,
      estimated: true,
    });
    // No piece weight: the catalog's typical pack.
    expect(outcomeWeight(outcome({ categoryId: 'dairy-milk', unit: 'pcs' }))).toEqual({
      grams: categoryById('dairy-milk')?.avgWeightGrams,
      estimated: true,
    });
    expect(outcomeWeight(outcome({ categoryId: 'unknown-category' }))).toEqual({
      grams: 0,
      estimated: true,
    });
  });
});

describe('summarizeFootprint', () => {
  it('sums weight, CO2e, water and land of rescued food', () => {
    const summary = summarizeFootprint(
      [outcome({ grams: 1000 }), outcome({ categoryId: 'bakery-bread', grams: 500 })],
      from,
      to,
    );
    // Milk 3.703 kg CO2e, 309.8 l, 4.068 m² per kg; bread 0.879, 241.9, 2.241.
    expect(summary.rescued).toEqual({
      count: 2,
      grams: 1500,
      co2eGrams: Math.round(3.703 * 1000 + 0.879 * 500),
      waterLitres: Math.round(309.8 + 241.9 * 0.5),
      landM2: Math.round((4.068 + 2.241 * 0.5) * 10) / 10,
      estimatedShare: 0,
    });
    expect(summary.wasted.count).toBe(0);
  });

  it('keeps rescued, entsorgt and merely eaten apart', () => {
    const summary = summarizeFootprint(
      [
        outcome({ grams: 400 }),
        outcome({ outcome: 'wasted', rescued: undefined, grams: 300 }),
        // Eaten without confirming a rescue: counts nowhere.
        outcome({ rescued: undefined, grams: 9000 }),
        outcome({ outcome: 'shared_out', grams: 100 }),
      ],
      from,
      to,
    );
    expect(summary.rescued).toMatchObject({ count: 2, grams: 500 });
    expect(summary.wasted).toMatchObject({ count: 1, grams: 300 });
  });

  it('leaves out undone outcomes, processed ingredients, other periods and non-food', () => {
    const summary = summarizeFootprint(
      [
        outcome({ grams: 100 }),
        outcome({ grams: 5000, deletedAt: IsoDateTimeSchema.parse('2026-11-11T09:00:00.000Z') }),
        outcome({ grams: 5000, madeInto: IdSchema.parse('0198d2f0-0000-7000-8000-000000000001') }),
        outcome({ grams: 5000, at: IsoDateTimeSchema.parse('2026-12-01T09:00:00.000Z') }),
        outcome({ grams: 5000, categoryId: 'nonfood-cleaning' }),
      ],
      from,
      to,
    );
    expect(summary.rescued).toMatchObject({ count: 1, grams: 100 });
  });

  it('reads the day in Swiss time: 22:30 UTC on 31 October is 1 November', () => {
    const summary = summarizeFootprint(
      [outcome({ grams: 100, at: IsoDateTimeSchema.parse('2026-10-31T23:30:00.000Z') })],
      from,
      to,
    );
    expect(summary.rescued.count).toBe(1);
  });

  it('shares the estimate by weight', () => {
    const summary = summarizeFootprint(
      [outcome({ grams: 300, unit: 'g' }), outcome({ categoryId: 'dairy-cream', grams: 100 })],
      from,
      to,
    );
    expect(summary.rescued.estimatedShare).toBe(0.25);
  });

  it('lists the top three categories by CO2e of the rescued food, wasted ones excluded', () => {
    const summary = summarizeFootprint(
      [
        outcome({ categoryId: 'meat-poultry', grams: 400 }),
        outcome({ categoryId: 'dairy-cheese-hard', grams: 200 }),
        outcome({ categoryId: 'dairy-milk', grams: 1000 }),
        outcome({ categoryId: 'produce-potatoes', grams: 2000 }),
        outcome({ categoryId: 'meat-minced', outcome: 'wasted', rescued: undefined, grams: 500 }),
      ],
      from,
      to,
    );
    expect(summary.topCategories.map((entry) => entry.categoryId)).toEqual([
      'dairy-cheese-hard',
      'meat-poultry',
      'dairy-milk',
    ]);
    expect(summary.topCategories[0]).toEqual({
      categoryId: 'dairy-cheese-hard',
      grams: 200,
      co2eGrams: Math.round(20.749 * 200),
    });
  });

  it('is all zero without outcomes', () => {
    const summary = summarizeFootprint([], from, to);
    expect(summary.rescued).toEqual({
      count: 0,
      grams: 0,
      co2eGrams: 0,
      waterLitres: 0,
      landM2: 0,
      estimatedShare: 0,
    });
    expect(summary.topCategories).toEqual([]);
    expect(summary.kehricht).toBeNull();
  });
});

describe('Kehricht estimate', () => {
  it('turns the rescued weight into 35-litre bags and a fee in Rappen', () => {
    // 4.89 kg is exactly one bag: CHF 1.60.
    expect(kehrichtEstimate(KEHRICHT.bagGrams)).toEqual({ bags: 1, feeRappen: rappen(160) });
    // 2.4 kg: 0.49 bags (0.5), and 78.5 Rappen rounds to 79.
    expect(kehrichtEstimate(2400)).toEqual({ bags: 0.5, feeRappen: rappen(79) });
    expect(Number.isInteger(kehrichtEstimate(1234)?.feeRappen)).toBe(true);
  });

  it('exists only for CHF households', () => {
    expect(kehrichtEstimate(5000, EUR)).toBeNull();
    expect(summarizeFootprint([outcome({ grams: 4890 })], from, to, EUR).kehricht).toBeNull();
    expect(summarizeFootprint([outcome({ grams: 4890 })], from, to).kehricht).toEqual({
      bags: 1,
      feeRappen: rappen(160),
    });
  });
});
