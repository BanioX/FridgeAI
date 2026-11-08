import { describe, expect, it } from 'vitest';
import { wasteHabits } from '../src';

const outcome = (
  itemId: string,
  at: string,
  kind: 'wasted' | 'eaten' = 'wasted',
  deletedAt?: string,
) => ({
  itemId,
  outcome: kind,
  at: `${at}T18:00:00.000Z`,
  ...(deletedAt === undefined ? {} : { deletedAt }),
});
const info: Record<string, { name: string; categoryId: string }> = {
  a: { name: 'Hummus Natur', categoryId: 'prepared-dips' },
  b: { name: 'Guacamole', categoryId: 'prepared-dips' },
  c: { name: 'Hummus Natur', categoryId: 'prepared-dips' },
  d: { name: 'Tomatenmark', categoryId: 'pantry-tomato-paste' },
  e: { name: 'Tomatenmark', categoryId: 'pantry-tomato-paste' },
  f: { name: 'Joghurt', categoryId: 'dairy-yoghurt' },
};
const habits = (outcomes: ReturnType<typeof outcome>[], since = '2026-08-01T00:00:00.000Z') =>
  wasteHabits({ outcomes, since, itemInfo: (id) => info[id] });

describe('wasteHabits (ADR-0038)', () => {
  it('ranks categories by how often they were thrown away, names newest first', () => {
    const result = habits([
      outcome('a', '2026-09-01'),
      outcome('b', '2026-10-15'),
      outcome('c', '2026-11-02'),
      outcome('d', '2026-10-01'),
      outcome('e', '2026-11-05'),
    ]);
    expect(
      result.map((habit) => [habit.categoryId, habit.times, habit.names, habit.lastOn]),
    ).toEqual([
      ['prepared-dips', 3, ['Hummus Natur', 'Guacamole'], '2026-11-02'],
      ['pantry-tomato-paste', 2, ['Tomatenmark'], '2026-11-05'],
    ]);
    expect(result[1]?.tip).toMatch(/Tube statt Dose/);
  });

  it('ignores what was eaten, undone or long ago, and single slips', () => {
    expect(
      habits([
        outcome('a', '2026-07-01'),
        outcome('b', '2026-10-15'),
        outcome('c', '2026-10-20', 'wasted', '2026-10-20T19:00:00.000Z'),
        outcome('f', '2026-10-21', 'eaten'),
        outcome('f', '2026-10-22', 'eaten'),
      ]),
    ).toEqual([]);
  });
});
