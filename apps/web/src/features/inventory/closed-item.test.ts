import { describe, expect, it } from 'vitest';
import { closedItemFrom } from './closed-item';

const id = '019a5a3b-6c00-7000-8000-000000000001';

describe('closedItemFrom', () => {
  it('reads closed and deleted items the detail page passed', () => {
    expect(
      closedItemFrom({
        closed: { kind: 'outcome', eventId: id, name: 'Mozzarella', outcome: 'eaten' },
      }),
    ).toEqual({ kind: 'outcome', eventId: id, name: 'Mozzarella', outcome: 'eaten' });
    expect(closedItemFrom({ closed: { kind: 'deleted', itemId: id, name: 'Apfel' } })).toEqual({
      kind: 'deleted',
      itemId: id,
      name: 'Apfel',
    });
    // History entries from before «kind» existed.
    expect(closedItemFrom({ closed: { eventId: id, name: 'Joghurt', outcome: 'wasted' } })).toEqual(
      { kind: 'outcome', eventId: id, name: 'Joghurt', outcome: 'wasted' },
    );
  });

  it('keeps the value of a confirmed rescue only as whole, non-negative Rappen', () => {
    const rescue = { kind: 'outcome', eventId: id, name: 'Joghurt', outcome: 'eaten' };
    expect(closedItemFrom({ closed: { ...rescue, rescuedRappen: 210 } })).toEqual({
      ...rescue,
      rescuedRappen: 210,
    });
    expect(closedItemFrom({ closed: { ...rescue, rescuedRappen: 120, estimated: true } })).toEqual({
      ...rescue,
      rescuedRappen: 120,
      estimated: true,
    });
    for (const rescuedRappen of [-5, 2.1, '210', Number.NaN, 2 ** 60]) {
      expect(closedItemFrom({ closed: { ...rescue, rescuedRappen } })).toEqual(rescue);
    }
  });

  it('ignores anything else in the history state', () => {
    for (const state of [
      null,
      undefined,
      'closed',
      {},
      { closed: null },
      { closed: { eventId: 'x', name: 'Mozzarella', outcome: 'eaten' } },
      { closed: { eventId: id, name: 'Mozzarella', outcome: 'lost' } },
      { closed: { eventId: id, name: 3, outcome: 'eaten' } },
      { closed: { kind: 'deleted', itemId: 'x', name: 'Apfel' } },
      { closed: { kind: 'burned', eventId: id, name: 'Apfel', outcome: 'eaten' } },
    ]) {
      expect(closedItemFrom(state)).toBeNull();
    }
  });
});

describe('closedItemFrom «Verarbeiten»', () => {
  it('reads a processed entry with its outcomes and the new item', () => {
    const closed = {
      kind: 'processed',
      name: 'Kuchen',
      outcomeIds: [id],
      resultItemId: id,
      location: 'fridge',
    };
    expect(closedItemFrom({ closed })).toEqual(closed);
    expect(closedItemFrom({ closed: { ...closed, resultItemId: undefined } })).toEqual({
      kind: 'processed',
      name: 'Kuchen',
      outcomeIds: [id],
      location: 'fridge',
    });
    expect(closedItemFrom({ closed: { ...closed, outcomeIds: ['x'] } })).toBeNull();
    expect(closedItemFrom({ closed: { ...closed, location: 'moon' } })).toBeNull();
  });
});
