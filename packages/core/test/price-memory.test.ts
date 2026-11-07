import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { rappen } from '../src/money';
import {
  differenceFromUsual,
  summarizePrices,
  unitPrice,
  type PriceObservation,
} from '../src/prices/price-memory';

const today = localDate('2026-11-07');
const paid = (
  day: string,
  amount: number,
  retailer: PriceObservation['retailer'] = 'coop',
  quantity = 1,
  unit: PriceObservation['unit'] = 'pcs',
): PriceObservation => ({
  retailer,
  purchasedOn: localDate(day),
  quantity,
  unit,
  paidRappen: rappen(amount),
  promotion: false,
});

describe('unitPrice', () => {
  it('compares per piece, per kilogram and per litre', () => {
    expect(unitPrice({ paidRappen: rappen(140), quantity: 2, unit: 'pcs' })).toBe(70);
    expect(unitPrice({ paidRappen: rappen(830), quantity: 307, unit: 'g' })).toBe(2704);
    expect(unitPrice({ paidRappen: rappen(195), quantity: 750, unit: 'ml' })).toBe(260);
    expect(unitPrice({ paidRappen: rappen(100), quantity: 0, unit: 'pcs' })).toBeNull();
  });
});

describe('summarizePrices (ADR-0029)', () => {
  it('knows the last price, the usual one and where it was cheapest', () => {
    const summary = summarizePrices(
      [
        paid('2026-10-01', 345),
        paid('2026-10-29', 300, 'lidl'),
        paid('2026-11-05', 345),
        paid('2026-10-15', 360),
      ],
      today,
    );
    expect(summary?.last).toMatchObject({
      purchasedOn: '2026-11-05',
      retailer: 'coop',
      unitPriceRappen: 345,
    });
    expect(summary?.usualUnitPriceRappen).toBe(345);
    expect(summary?.cheapest).toMatchObject({ retailer: 'lidl', unitPriceRappen: 300 });
    expect(summary?.count).toBe(4);
  });

  it('needs two recent prices for «usual», ignores old ones and other units', () => {
    expect(summarizePrices([], today)).toBeNull();
    const single = summarizePrices([paid('2026-11-05', 345)], today);
    expect(single?.usualUnitPriceRappen).toBeUndefined();
    const old = summarizePrices([paid('2026-01-05', 200), paid('2026-11-05', 345)], today);
    expect(old?.usualUnitPriceRappen).toBeUndefined();
    const mixed = summarizePrices(
      [
        paid('2026-11-01', 999, 'coop', 1, 'pcs'),
        paid('2026-11-02', 213, 'migros', 734, 'g'),
        paid('2026-11-05', 196, 'lidl', 984, 'g'),
      ],
      today,
    );
    expect(mixed?.count).toBe(2);
    expect(mixed?.usualUnitPriceRappen).toBe(245);
  });

  it('the usual price always lies between the cheapest and the dearest recent price', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 50_000 }), { minLength: 2, maxLength: 30 }),
        (amounts) => {
          const summary = summarizePrices(
            amounts.map((amount, index) =>
              paid(`2026-10-${String((index % 28) + 1).padStart(2, '0')}`, amount),
            ),
            today,
          );
          const usual = summary?.usualUnitPriceRappen ?? 0;
          return (
            usual >= Math.min(...amounts) &&
            usual <= Math.max(...amounts) &&
            summary?.cheapest?.unitPriceRappen === Math.min(...amounts)
          );
        },
      ),
    );
  });
});

describe('differenceFromUsual', () => {
  it('says how much dearer or cheaper, but not for a few Rappen', () => {
    expect(differenceFromUsual(rappen(387), rappen(345))).toBe(12);
    expect(differenceFromUsual(rappen(300), rappen(345))).toBe(-13);
    expect(differenceFromUsual(rappen(355), rappen(345))).toBeNull();
    expect(differenceFromUsual(rappen(100), rappen(0))).toBeNull();
  });
});
