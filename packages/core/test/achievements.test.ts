import { describe, expect, it } from 'vitest';
import {
  achievements,
  ACHIEVEMENTS,
  rappen,
  type AchievementId,
  type AchievementInput,
} from '../src';
import {
  at,
  event,
  id,
  input,
  item,
  nthDay,
  outcome,
  rescue,
  stateOf,
  TODAY,
} from './achievements-fixtures';

/**
 * The achievements (docs/abzeichen.md, ADR-0054): the catalogue and every tier boundary of the
 * counting achievements. The rules of each family are in `achievements-rules.test.ts`.
 */
describe('the catalogue', () => {
  it('lists all 18 achievements of docs/abzeichen.md in order, none of them «Gemeinsam»', () => {
    const states = achievements(input(), TODAY);
    expect(states).toHaveLength(18);
    expect(states.map((state) => state.id)).toEqual(ACHIEVEMENTS.map((entry) => entry.id));
    expect(states.every((state) => state.tier === 0 && state.reachedOn === null)).toBe(true);
  });

  it('shows the first threshold as the next goal of an empty household', () => {
    const states = achievements(input(), TODAY);
    expect(states.find((state) => state.id === 'rescue-service')?.progress).toEqual({
      current: 0,
      next: 10,
    });
    expect(states.find((state) => state.id === 'savings')?.progress).toEqual({
      current: 0,
      next: 2_000,
    });
  });
});

/** Counting achievements: each builds `n` qualifying things and has the catalogue's thresholds. */
const counting: Record<
  string,
  { id: AchievementId; make: (n: number) => Partial<AchievementInput> }
> = {
  rescues: {
    id: 'rescue-service',
    make: (n) => ({ outcomes: Array.from({ length: n }, (_, i) => rescue(nthDay(i))) }),
  },
  'last day': {
    id: 'last-day',
    make: (n) => {
      const items = Array.from({ length: n }, (_, i) =>
        item({ expiresOn: nthDay(i), status: 'eaten' }),
      );
      return { items, outcomes: items.map((entry, i) => outcome(nthDay(i), { itemId: entry.id })) };
    },
  },
  'all senses': {
    id: 'all-senses',
    make: (n) => {
      const items = Array.from({ length: n }, (_, i) =>
        item({ expiresOn: nthDay(i - 2), status: 'eaten', expiryKind: 'best_before' }),
      );
      return {
        items,
        outcomes: items.map((entry, i) => outcome(nthDay(i), { itemId: entry.id })),
      };
    },
  },
  'own recipes': {
    id: 'own-cookbook',
    make: (n) => ({
      recipes: Array.from({ length: n }, (_, i) => ({ id: id(), createdAt: at(nthDay(i)) })),
    }),
  },
  receipts: {
    id: 'bookkeeping',
    make: (n) => {
      const receipts = Array.from({ length: n }, () => ({ id: id() }));
      return {
        receipts,
        events: receipts.map((receipt, i) =>
          event('receipt.imported', nthDay(i), {
            receiptId: receipt.id,
            retailer: 'coop',
            lineCount: 3,
            totalRappen: rappen(1000),
          }),
        ),
      };
    },
  },
  cooked: {
    id: 'at-the-stove',
    make: (n) => {
      const ingredients = Array.from({ length: n }, () => id());
      return {
        // The ingredient outcome is written a moment before the event, like `inventory.process`.
        outcomes: ingredients.map((itemId, i) =>
          outcome(nthDay(i), { itemId, at: at(nthDay(i), '09:59:59') }),
        ),
        events: ingredients.map((itemId, i) =>
          event('item.processed', nthDay(i), {
            ingredientIds: [itemId],
            kind: 'cooked',
            recipeId: 'pasta',
          }),
        ),
      };
    },
  },
  freezing: {
    id: 'foresight',
    make: (n) => {
      const items = Array.from({ length: n }, () => item({ location: 'freezer' }));
      return {
        items,
        events: items.map((entry, i) =>
          event('item.moved', nthDay(i), {
            itemId: entry.id,
            from: 'fridge',
            to: 'freezer',
            expiresOn: nthDay(i + 90),
            previousExpiresOn: nthDay(i + 1),
          }),
        ),
      };
    },
  },
  leftovers: {
    id: 'leftover-kitchen',
    make: (n) => {
      const items = Array.from({ length: n }, () => item({ origin: 'leftover', status: 'eaten' }));
      return {
        items,
        outcomes: items.map((entry, i) => outcome(nthDay(i), { itemId: entry.id })),
      };
    },
  },
};

describe.each(Object.entries(counting))('%s', (_name, { id: achievementId, make }) => {
  const thresholds = ACHIEVEMENTS.find((entry) => entry.id === achievementId)?.thresholds ?? [];
  it('has the catalogue thresholds', () => {
    expect(thresholds.length).toBeGreaterThan(0);
  });
  it.each(thresholds.map((threshold, index) => [threshold, index + 1] as const))(
    'reaches tier %# at %i',
    (threshold, tier) => {
      expect(stateOf(achievementId, make(threshold - 1)).tier).toBe(tier - 1);
      const reached = stateOf(achievementId, make(threshold));
      expect(reached.tier).toBe(tier);
      expect(reached.reachedOn).toBe(nthDay(threshold - 1));
      expect(reached.progress.current).toBe(threshold);
    },
  );
});
