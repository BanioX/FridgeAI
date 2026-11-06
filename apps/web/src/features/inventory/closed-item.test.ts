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
