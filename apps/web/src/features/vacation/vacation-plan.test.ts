import type { InventoryItemView, LocalDate } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { vacationPlan } from './vacation-plan';

const d = (text: string) => text as LocalDate;
let counter = 0;
function item(
  name: string,
  categoryId: string,
  location: InventoryItemView['location'],
  expiresOn: LocalDate,
): InventoryItemView {
  counter += 1;
  return {
    id: `item-${String(counter)}`,
    name,
    categoryId,
    location,
    expiresOn,
  } as InventoryItemView;
}

describe('vacationPlan', () => {
  it('splits freezable from not freezable', () => {
    const plan = vacationPlan(
      [
        item('Hackfleisch', 'meat-minced', 'fridge', d('2026-11-16')),
        item('Kopfsalat', 'produce-salad', 'fridge', d('2026-11-15')),
      ],
      d('2026-11-20'),
    );
    expect(plan.freeze.map((i) => i.name)).toEqual(['Hackfleisch']);
    expect(plan.useUp.map((i) => i.name)).toEqual(['Kopfsalat']);
  });

  it('sorts each group by date, soonest first', () => {
    const plan = vacationPlan(
      [
        item('Hackfleisch B', 'meat-minced', 'fridge', d('2026-11-18')),
        item('Hackfleisch A', 'meat-minced', 'fridge', d('2026-11-14')),
        item('Hackfleisch C', 'meat-minced', 'fridge', d('2026-11-16')),
      ],
      d('2026-11-20'),
    );
    expect(plan.freeze.map((i) => i.name)).toEqual([
      'Hackfleisch A',
      'Hackfleisch C',
      'Hackfleisch B',
    ]);
  });

  it('only watches the fridge and the pantry', () => {
    const plan = vacationPlan(
      [
        item('Erbsen', 'meat-minced', 'freezer', d('2026-11-14')),
        item('Notration', 'meat-minced', 'reserve', d('2026-11-14')),
        item('Reis', 'pantry-rice', 'pantry', d('2026-11-14')),
        item('Milch', 'dairy-milk', 'fridge', d('2026-11-14')),
      ],
      d('2026-11-20'),
    );
    expect([...plan.freeze, ...plan.useUp].map((i) => i.name).sort()).toEqual(['Milch', 'Reis']);
  });

  it('includes the return day and leaves later dates out', () => {
    const plan = vacationPlan(
      [
        item('Am Tag', 'dairy-milk', 'fridge', d('2026-11-20')),
        item('Danach', 'dairy-milk', 'fridge', d('2026-11-21')),
      ],
      d('2026-11-20'),
    );
    expect(plan.freeze.map((i) => i.name)).toEqual(['Am Tag']);
  });

  it('keeps items that are already expired', () => {
    const plan = vacationPlan(
      [item('Alt', 'dairy-milk', 'fridge', d('2026-11-01'))],
      d('2026-11-20'),
    );
    expect(plan.freeze).toHaveLength(1);
  });

  it('is empty when nothing runs out', () => {
    expect(vacationPlan([], d('2026-11-20'))).toEqual({ freeze: [], useUp: [] });
  });
});
