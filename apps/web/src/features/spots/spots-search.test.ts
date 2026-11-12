import type { InventoryItemView } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { findInStock, fold } from './spots-search';

const item = (id: string, name: string) => ({ id, name }) as InventoryItemView;
const stock = [item('1', 'Kristallzucker'), item('2', 'Crème fraîche'), item('3', 'Tee')];

describe('findInStock', () => {
  it('finds by part of the name, ignoring case and accents', () => {
    expect(findInStock(stock, 'zucker').map((entry) => entry.id)).toEqual(['1']);
    expect(findInStock(stock, 'CREME').map((entry) => entry.id)).toEqual(['2']);
  });

  it('finds nothing for an empty or blank query', () => {
    expect(findInStock(stock, '')).toEqual([]);
    expect(findInStock(stock, '   ')).toEqual([]);
  });

  it('folds text', () => {
    expect(fold('  Äpfel ')).toBe('apfel');
  });
});
