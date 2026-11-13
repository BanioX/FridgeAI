import { describe, expect, it } from 'vitest';
import { nearestIndex, wheelText, wheelValues } from './amount-wheel';

describe('wheelValues (ADR-0083)', () => {
  it('steps by 5 for small packs and ends on the whole pack', () => {
    expect(wheelValues(30)).toEqual([5, 10, 15, 20, 25, 30]);
    expect(wheelValues(42)).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 42]);
  });

  it('steps by 10 up to a litre or a kilo, by 50 above', () => {
    const half = wheelValues(500);
    expect(half.slice(0, 3)).toEqual([10, 20, 30]);
    expect(half.at(-1)).toBe(500);
    expect(half).toHaveLength(50);
    const big = wheelValues(1500);
    expect(big.slice(0, 2)).toEqual([50, 100]);
    expect(big.at(-1)).toBe(1500);
  });

  it('is empty when nothing is left', () => {
    expect(wheelValues(0)).toEqual([]);
  });

  it('finds the nearest stop', () => {
    expect(nearestIndex([10, 20, 30], 24)).toBe(1);
    expect(nearestIndex([10, 20, 30], 999)).toBe(2);
  });

  it('reads grams and kilos, millilitres and litres, never decilitres', () => {
    expect(wheelText(250, 'g')).toBe('250 g');
    expect(wheelText(1250, 'g')).toBe('1.25 kg');
    expect(wheelText(700, 'ml')).toBe('700 ml');
    expect(wheelText(1500, 'ml')).toBe('1.5 l');
  });
});
