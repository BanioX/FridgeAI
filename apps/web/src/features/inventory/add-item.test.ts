import { categoryById, localDate, type Category } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  parseAmount,
  parsePackSize,
  suggestedAmount,
  suggestedExpiry,
} from './add-item';

const category = (id: string): Category => {
  const found = categoryById(id);
  if (found === undefined) {
    throw new Error(id);
  }
  return found;
};

describe('parseAmount', () => {
  it('accepts decimal comma and point', () => {
    expect(parseAmount('1,5')).toBe(1.5);
    expect(parseAmount(' 2.25 ')).toBe(2.25);
    expect(parseAmount('.5')).toBe(0.5);
    expect(parseAmount('6')).toBe(6);
  });

  it('rejects empty, zero, negative and text', () => {
    for (const text of ['', '0', '-1', 'abc', '1,5,2', '1 kg']) {
      expect(parseAmount(text), text).toBeNull();
    }
  });

  it('formats with a decimal point and no thousands separator', () => {
    expect(formatAmount(1.5)).toBe('1.5');
    expect(formatAmount(300)).toBe('300');
    expect(formatAmount(1250)).toBe('1250');
    expect(formatAmount(0.1 + 0.2)).toBe('0.3');
  });
});

describe('suggestedAmount', () => {
  it('suggests one piece for counted food', () => {
    expect(suggestedAmount(category('dairy-eggs'))).toEqual({ amount: 1, unit: 'pcs' });
    expect(suggestedAmount(category('produce-bananas'))).toEqual({ amount: 1, unit: 'pcs' });
  });

  it('suggests the typical pack in a natural unit', () => {
    expect(suggestedAmount(category('dairy-milk'))).toEqual({ amount: 1, unit: 'l' });
    expect(suggestedAmount(category('dairy-cheese-hard'))).toEqual({ amount: 300, unit: 'g' });
  });
});

describe('suggestedExpiry', () => {
  const today = localDate('2026-11-06');

  it('estimates from the category and the location', () => {
    expect(suggestedExpiry(category('dairy-milk'), 'fridge', today)).toBe('2026-11-13');
  });

  it('falls back to the default location where the food does not keep', () => {
    // Milk has no Notvorrat value: the fridge estimate is used.
    expect(suggestedExpiry(category('dairy-milk'), 'reserve', today)).toBe('2026-11-13');
  });
});

describe('parsePackSize', () => {
  it('reads pack sizes as printed', () => {
    expect(parsePackSize('1 l')).toEqual({ amount: 1, unit: 'l' });
    expect(parsePackSize('500g')).toEqual({ amount: 500, unit: 'g' });
    expect(parsePackSize('2,5 dl')).toEqual({ amount: 2.5, unit: 'dl' });
    expect(parsePackSize('1.5 L')).toEqual({ amount: 1.5, unit: 'l' });
  });

  it('ignores multipacks and anything unclear', () => {
    for (const text of ['6 x 125 g', '4 Stück', 'ca. 300 g', '']) {
      expect(parsePackSize(text), text).toBeNull();
    }
  });
});
