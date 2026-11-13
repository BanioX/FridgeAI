import type { LocalDate } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { batchRows } from './batch-rows';

const today = '2026-11-13' as LocalDate;

describe('batchRows', () => {
  it('returns nothing for an empty sentence', () => {
    expect(batchRows('  ', today)).toEqual([]);
  });

  it('makes one row per product with category, location and a future date', () => {
    const rows = batchRows('3 Äpfel, Salat, 500 g Rüebli, Milch', today);
    expect(rows.map((row) => row.name)).toEqual(['Äpfel', 'Salat', 'Rüebli', 'Milch']);
    for (const row of rows) {
      expect(row.categoryId).not.toBe('');
      expect(row.emoji).not.toBe('');
      expect(row.expiresOn > today).toBe(true);
      expect(row.quantity).toBeGreaterThan(0);
    }
    expect(rows[0]).toMatchObject({ quantity: 3, unit: 'pcs' });
    expect(rows[2]).toMatchObject({ quantity: 500, unit: 'g' });
  });

  it('puts an unknown food into the fridge', () => {
    const [row] = batchRows('Xyzzyquark', today);
    expect(row?.location).toBe('fridge');
  });

  it('uses the suggested amount when none is given', () => {
    const [row] = batchRows('Milch', today);
    expect(row?.unit).toBe('ml');
    expect(row?.quantity).toBeGreaterThan(0);
  });
});
