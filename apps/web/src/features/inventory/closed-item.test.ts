import { describe, expect, it } from 'vitest';
import { closedItemFrom } from './closed-item';

const eventId = '019a5a3b-6c00-7000-8000-000000000001';

describe('closedItemFrom', () => {
  it('reads what the detail page passed', () => {
    expect(closedItemFrom({ closed: { eventId, name: 'Mozzarella', outcome: 'eaten' } })).toEqual({
      eventId,
      name: 'Mozzarella',
      outcome: 'eaten',
    });
  });

  it('ignores anything else in the history state', () => {
    for (const state of [
      null,
      undefined,
      'closed',
      {},
      { closed: null },
      { closed: { eventId: 'x', name: 'Mozzarella', outcome: 'eaten' } },
      { closed: { eventId, name: 'Mozzarella', outcome: 'lost' } },
      { closed: { eventId, name: 3, outcome: 'eaten' } },
    ]) {
      expect(closedItemFrom(state)).toBeNull();
    }
  });
});
