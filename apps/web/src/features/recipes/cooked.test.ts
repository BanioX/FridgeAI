import { IdSchema, localDate } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { defaultChoice, usedFood, type UsedFood } from './cooked';

const today = localDate('2026-11-06');
const food = (n: number, expiresOn: string): UsedFood => ({
  itemId: IdSchema.parse(`01890000-0000-7000-8000-${String(n).padStart(12, '0')}`),
  name: `Ding ${String(n)}`,
  quantity: 1,
  unit: 'pcs',
  expiresOn: localDate(expiresOn),
  expiryKind: 'best_before',
});

describe('after cooking', () => {
  it('lists each food once', () => {
    const eggs = food(1, '2026-11-20');
    const milk = food(2, '2026-11-07');
    expect(usedFood([{ atHome: [eggs] }, { atHome: [eggs, milk] }, { atHome: [] }])).toEqual([
      eggs,
      milk,
    ]);
  });

  it('preselects «Alles» for food that had to be rescued and «Nichts» for fresh food', () => {
    expect(defaultChoice(food(1, '2026-11-06'), today)).toBe('all');
    expect(defaultChoice(food(1, '2026-11-08'), today)).toBe('all');
    expect(defaultChoice(food(1, '2026-11-01'), today)).toBe('all');
    expect(defaultChoice(food(1, '2026-11-20'), today)).toBe('none');
  });
});
