import { localDate, rappen, type ParsedReceiptLine } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { priceHint, type PriceMemory } from './price-hint';

const line = (price: number, discount = 0, quantity = 1): ParsedReceiptLine => ({
  rawText: 'Skyr Natur',
  kind: 'item',
  name: 'Skyr Natur',
  quantity,
  unit: 'pcs',
  priceRappen: rappen(price),
  discountRappen: rappen(discount),
});

const memory = (usual?: number): PriceMemory => ({
  name: 'Skyr Natur',
  count: 2,
  last: {
    retailer: 'coop',
    purchasedOn: localDate('2026-11-05'),
    quantity: 1,
    unit: 'pcs',
    paidRappen: rappen(232),
    promotion: false,
    unitPriceRappen: rappen(232),
  },
  ...(usual === undefined ? {} : { usualUnitPriceRappen: rappen(usual) }),
});

describe('priceHint (ADR-0029)', () => {
  it('says dearer or cheaper than usual, per piece and after discounts', () => {
    expect(priceHint(line(260), memory(232))).toEqual({
      text: '12 % teurer als sonst',
      tone: 'dearer',
    });
    expect(priceHint(line(464, -64, 2), memory(232))).toEqual({
      text: '14 % günstiger als sonst',
      tone: 'cheaper',
    });
  });

  it('falls back to the last price and stays quiet without memory', () => {
    expect(priceHint(line(235), memory(232))).toEqual({
      text: 'zuletzt 2.32 bei Coop',
      tone: 'info',
    });
    expect(priceHint(line(260), memory())).toEqual({ text: 'zuletzt 2.32 bei Coop', tone: 'info' });
    expect(priceHint(line(470, 0, 2), memory())).toEqual({
      text: 'zuletzt 2.32/Stück bei Coop',
      tone: 'info',
    });
    expect(priceHint(line(260), undefined)).toBeNull();
    expect(priceHint(line(260), { name: 'Skyr Natur', count: 0 })).toBeNull();
  });
});
