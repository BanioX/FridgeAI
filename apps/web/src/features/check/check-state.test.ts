import { localDate, type InventoryItemView } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { checkDue, checkQueue, readLastCheck, tally, writeLastCheck } from './check-state';

const today = localDate('2026-11-06');

const item = (name: string, location: string, expiresOn: string, categoryId = 'dairy-yoghurt') =>
  ({ name, location, expiresOn, categoryId }) as unknown as InventoryItemView;

function memoryStore() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe('fridge check', () => {
  it('asks only for fridge items, soonest first', () => {
    const queue = checkQueue(
      [
        item('Joghurt', 'fridge', '2026-11-12'),
        item('Erbsen', 'freezer', '2026-11-07'),
        item('Milch', 'fridge', '2026-11-07'),
        item('Butter', 'fridge', '2026-11-07'),
      ],
      today,
    );
    expect(queue.map((entry) => entry.name)).toEqual(['Butter', 'Milch', 'Joghurt']);
  });

  it('leaves out robust food with a far date, like a cola in the fridge (ADR-0038)', () => {
    const queue = checkQueue(
      [
        item('Cola', 'fridge', '2027-06-01', 'drinks-soft'),
        item('Senf', 'fridge', '2027-06-01', 'pantry-sauces'),
        item('Hummus', 'fridge', '2026-11-20', 'prepared-dips'),
        item('Bier', 'fridge', '2026-11-10', 'drinks-alcohol'),
      ],
      today,
    );
    expect(queue.map((entry) => entry.name)).toEqual(['Bier', 'Hummus']);
  });

  it('is due without a check or after a week', () => {
    expect(checkDue(null, today)).toBe(true);
    expect(checkDue(localDate('2026-11-01'), today)).toBe(false);
    expect(checkDue(localDate('2026-10-30'), today)).toBe(true);
  });

  it('counts the answers', () => {
    expect(tally(['still', 'still', 'half', 'wasted'])).toEqual({
      still: 2,
      half: 1,
      eaten: 0,
      wasted: 1,
    });
  });

  it('remembers the day of the last check and survives broken storage', () => {
    const store = memoryStore();
    expect(readLastCheck(store)).toBeNull();
    writeLastCheck(today, store);
    expect(readLastCheck(store)).toBe(today);
    store.setItem('fridgeai:last-fridge-check', 'kaputt');
    expect(readLastCheck(store)).toBeNull();
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readLastCheck(broken)).toBeNull();
    expect(() => {
      writeLastCheck(today, broken);
    }).not.toThrow();
  });
});
