import { describe, expect, it } from 'vitest';
import { localDate, rappen, type AchievementOutcome, type DomainEvent } from '../src';
import {
  at,
  DELETED,
  event,
  id,
  item,
  outcome,
  rescue,
  stateOf,
  first,
} from './achievements-fixtures';

/** Retten, Bilanz, Kochen und Verarbeiten (docs/abzeichen.md, «Regeln im Detail»). */
describe('Retten', () => {
  it('«Erste Rettung» is one-time: the first confirmed rescue', () => {
    expect(stateOf('first-rescue', {}).tier).toBe(0);
    const outcomes = [rescue('2026-10-05'), rescue('2026-10-09')];
    expect(stateOf('first-rescue', { outcomes })).toMatchObject({
      tier: 1,
      reachedOn: '2026-10-05',
      progress: { next: null },
    });
  });

  it('counts only confirmed rescues: not plain eating, not entsorgt, not a moved-on ingredient', () => {
    const outcomes = [
      outcome('2026-10-05'),
      outcome('2026-10-05', { outcome: 'wasted', valueRappen: rappen(500) }),
      outcome('2026-10-05', { rescued: true, madeInto: id() }),
    ];
    expect(stateOf('rescue-service', { outcomes }).progress.current).toBe(0);
    expect(stateOf('first-rescue', { outcomes }).tier).toBe(0);
  });

  it('counts a rescue that was given away, too', () => {
    const outcomes = [rescue('2026-10-05', { outcome: 'shared_out' })];
    expect(stateOf('first-rescue', { outcomes }).tier).toBe(1);
  });

  it('takes progress away when an outcome is undone, and the day moves with it', () => {
    const first = rescue('2026-10-05');
    const second = rescue('2026-10-09');
    expect(stateOf('first-rescue', { outcomes: [first, second] }).reachedOn).toBe('2026-10-05');
    const undone = [{ ...first, deletedAt: DELETED }, second];
    expect(stateOf('first-rescue', { outcomes: undone }).reachedOn).toBe('2026-10-09');
    const none = [
      { ...first, deletedAt: DELETED },
      { ...second, deletedAt: DELETED },
    ];
    expect(stateOf('first-rescue', { outcomes: none })).toMatchObject({
      tier: 0,
      reachedOn: null,
      progress: { current: 0, next: 1 },
    });
  });

  it('«Sparbuch» sums the rescued value in Rappen, estimates included', () => {
    const value = (rappenValue: number, date: string) =>
      rescue(date, { valueRappen: rappen(rappenValue), valueEstimated: true });
    const tier = (rappenValue: number) =>
      stateOf('savings', { outcomes: [value(rappenValue, '2026-10-01')] }).tier;
    expect(tier(1_999)).toBe(0);
    expect(tier(2_000)).toBe(1);
    expect(tier(9_999)).toBe(1);
    expect(tier(10_000)).toBe(2);
    expect(tier(49_999)).toBe(2);
    expect(tier(50_000)).toBe(3);
    const outcomes = [value(1_500, '2026-10-01'), value(500, '2026-10-03')];
    expect(stateOf('savings', { outcomes })).toMatchObject({
      tier: 1,
      reachedOn: '2026-10-03',
      progress: { current: 2_000, next: 10_000 },
    });
  });

  it('«Auf den letzten Tag» needs the closing on the day of the date, not before or after', () => {
    const on = item({ expiresOn: localDate('2026-10-10'), status: 'eaten' });
    const early = item({ expiresOn: localDate('2026-10-11'), status: 'eaten' });
    const late = item({ expiresOn: localDate('2026-10-08'), status: 'eaten' });
    const outcomes = [
      outcome('2026-10-10', { itemId: on.id }),
      outcome('2026-10-10', { itemId: early.id }),
      outcome('2026-10-10', { itemId: late.id }),
    ];
    expect(stateOf('last-day', { items: [on, early, late], outcomes }).progress.current).toBe(1);
  });

  it('«Auf den letzten Tag» ignores entsorgt and items that were deleted', () => {
    const wasted = item({ expiresOn: localDate('2026-10-10'), status: 'wasted' });
    const gone = item({ expiresOn: localDate('2026-10-10'), deletedAt: DELETED });
    const outcomes = [
      outcome('2026-10-10', { itemId: wasted.id, outcome: 'wasted' }),
      outcome('2026-10-10', { itemId: gone.id }),
    ];
    expect(stateOf('last-day', { items: [wasted, gone], outcomes }).progress.current).toBe(0);
  });

  it('«Mit allen Sinnen» counts best-before food verwertet after its date, never use-by food', () => {
    const mhd = item({ expiresOn: localDate('2026-10-10'), expiryKind: 'best_before' });
    const useBy = item({ expiresOn: localDate('2026-10-10'), expiryKind: 'use_by' });
    const before = item({ expiresOn: localDate('2026-10-10'), expiryKind: 'best_before' });
    const outcomes = [
      outcome('2026-10-11', { itemId: mhd.id }),
      outcome('2026-10-11', { itemId: useBy.id }),
      outcome('2026-10-10', { itemId: before.id }),
    ];
    const items = [mhd, useBy, before];
    expect(stateOf('all-senses', { items, outcomes }).progress.current).toBe(1);
  });
});

/** n completed months of ten closings each, starting in January 2026. */
function monthsOfTen(count: number, wastedPerMonth = 0): AchievementOutcome[] {
  return Array.from({ length: count }, (_, month) => {
    const first = `2026-${String(month + 1).padStart(2, '0')}-`;
    return Array.from({ length: 10 }, (_, closing) =>
      outcome(`${first}${String(closing + 1).padStart(2, '0')}`, {
        outcome: closing < wastedPerMonth ? 'wasted' : 'eaten',
      }),
    );
  }).flat();
}

describe('Bilanz', () => {
  const july = localDate('2026-07-15');
  const tierOf = (id: 'nothing-wasted' | 'frugal', outcomes: AchievementOutcome[]) =>
    stateOf(id, { outcomes }, july).tier;

  it('«Nichts entsorgt» counts completed months with ten closings and nothing entsorgt', () => {
    expect(tierOf('nothing-wasted', monthsOfTen(1))).toBe(1);
    expect(tierOf('nothing-wasted', monthsOfTen(2))).toBe(1);
    expect(tierOf('nothing-wasted', monthsOfTen(3))).toBe(2);
    expect(tierOf('nothing-wasted', monthsOfTen(5))).toBe(2);
    expect(stateOf('nothing-wasted', { outcomes: monthsOfTen(6) }, july)).toMatchObject({
      tier: 3,
      progress: { current: 6, next: null },
    });
    // A month is complete on the first of the next one.
    expect(stateOf('nothing-wasted', { outcomes: monthsOfTen(1) }, july).reachedOn).toBe(
      '2026-02-01',
    );
  });

  it('does not count the running month', () => {
    const outcomes = monthsOfTen(1);
    expect(stateOf('nothing-wasted', { outcomes }, localDate('2026-01-31')).tier).toBe(0);
    expect(stateOf('nothing-wasted', { outcomes }, localDate('2026-02-01')).tier).toBe(1);
  });

  it('needs at least ten closings: nine is an empty month, no frugal one (principle 6)', () => {
    const nine = monthsOfTen(1).slice(1);
    expect(nine).toHaveLength(9);
    expect(tierOf('nothing-wasted', nine)).toBe(0);
    expect(tierOf('frugal', nine)).toBe(0);
    expect(tierOf('nothing-wasted', monthsOfTen(1))).toBe(1);
  });

  it('counts closings like the Bilanz: an ingredient that moved on is no closing', () => {
    const outcomes = [...monthsOfTen(1).slice(1), outcome('2026-01-20', { madeInto: id() })];
    expect(tierOf('nothing-wasted', outcomes)).toBe(0);
  });

  it('an undone closing takes the month below ten', () => {
    const outcomes = monthsOfTen(1);
    outcomes[0] = { ...first(outcomes), deletedAt: DELETED };
    expect(tierOf('nothing-wasted', outcomes)).toBe(0);
  });

  it('«Nichts entsorgt» is broken by one entsorgt closing', () => {
    expect(tierOf('nothing-wasted', monthsOfTen(1, 1))).toBe(0);
  });

  it('«Sparsam» means under 5 % entsorgt by value', () => {
    // Ten closings of CHF 1.00: one entsorgt is 10 %.
    expect(tierOf('frugal', monthsOfTen(1, 1))).toBe(0);
    const month = (wastedRappen: number) =>
      monthsOfTen(1).map((entry, index) =>
        index === 0
          ? { ...entry, outcome: 'wasted' as const, valueRappen: rappen(wastedRappen) }
          : { ...entry, valueRappen: rappen(1_000) },
      );
    // 449 of 9449 is 4.75 %; 474 of 9474 is 5.003 %.
    expect(tierOf('frugal', month(449))).toBe(1);
    expect(tierOf('frugal', month(474))).toBe(0);
    expect(tierOf('frugal', monthsOfTen(3))).toBe(2);
  });

  describe('«Fortschritt»', () => {
    const closingsOf = (month: string, wasted: number, closings = 10) =>
      Array.from({ length: closings }, (_, i) =>
        outcome(`${month}-${String(i + 1).padStart(2, '0')}`, {
          outcome: i === 0 ? 'wasted' : 'eaten',
          valueRappen: rappen(i === 0 ? wasted : 100),
        }),
      );
    // January is the first full month, CHF 100.00 entsorgt; the later month is February.
    const base = closingsOf('2026-01', 10_000);
    const tierFor = (wasted: number, closings = 10) =>
      stateOf('progress', { outcomes: [...base, ...closingsOf('2026-02', wasted, closings)] }, july)
        .tier;

    it('follows a month against the first, by whole percent, from −25 % on', () => {
      // Whole percent, rounded like «Seit deinem ersten Monat» shows it: 24.5 % is 25 %.
      expect(tierFor(7_551)).toBe(0);
      expect(tierFor(7_550)).toBe(1);
      expect(tierFor(5_051)).toBe(1);
      expect(tierFor(5_050)).toBe(2);
      expect(tierFor(2_551)).toBe(2);
      expect(tierFor(2_550)).toBe(3);
    });

    it('ignores a later month with fewer than ten closings', () => {
      expect(tierFor(100, 9)).toBe(0);
    });

    it('keeps the best month and says when it was complete', () => {
      const outcomes = [...base, ...closingsOf('2026-02', 5_000), ...closingsOf('2026-03', 9_000)];
      expect(stateOf('progress', { outcomes }, july)).toMatchObject({
        tier: 2,
        reachedOn: '2026-03-01',
        progress: { current: 50, next: 75 },
      });
    });

    it('has no baseline without entsorgt in the first month, and never goes below 0', () => {
      expect(stateOf('progress', { outcomes: monthsOfTen(2) }, july).tier).toBe(0);
      const worse = [...base, ...closingsOf('2026-02', 20_000)];
      expect(stateOf('progress', { outcomes: worse }, july).progress.current).toBe(0);
    });
  });

  it('«Jahresabschluss» comes 365 days after the first closing', () => {
    const outcomes = [outcome('2025-11-12')];
    expect(stateOf('year-end', { outcomes }, localDate('2026-11-12'))).toMatchObject({
      tier: 1,
      reachedOn: '2026-11-12',
    });
    expect(stateOf('year-end', { outcomes }, localDate('2026-11-11'))).toMatchObject({
      tier: 0,
      progress: { current: 364, next: 365 },
    });
    const undone = [{ ...first(outcomes), deletedAt: DELETED }];
    expect(stateOf('year-end', { outcomes: undone }).tier).toBe(0);
  });
});

describe('Kochen und Verarbeiten', () => {
  type Processed = Extract<DomainEvent, { type: 'item.processed' }>['payload'];
  const processed = (date: string, payload: Processed) => event('item.processed', date, payload);

  it('«Am Herd» counts a processed event with a recipe, with or without leftovers', () => {
    const cake = item({ origin: 'leftover' });
    const ingredient = id();
    const events = [
      processed('2026-10-01', {
        ingredientIds: [ingredient],
        resultId: cake.id,
        kind: 'leftover',
        recipeId: 'r1',
      }),
      // Not from a recipe: «Verarbeiten» alone is no cooking from a recipe.
      processed('2026-10-02', { ingredientIds: [ingredient], resultId: cake.id, kind: 'made' }),
    ];
    const outcomes = [outcome('2026-10-01', { itemId: ingredient, madeInto: cake.id })];
    expect(stateOf('at-the-stove', { events, items: [cake], outcomes })).toMatchObject({
      tier: 1,
      progress: { current: 1 },
    });
  });

  it('«Am Herd» no longer counts «Gekocht» once its ingredient outcomes are undone', () => {
    const ingredient = id();
    const events = [
      processed('2026-10-01', { ingredientIds: [ingredient], kind: 'cooked', recipeId: 'r1' }),
    ];
    const eaten = outcome('2026-10-01', { itemId: ingredient, at: at('2026-10-01', '09:59:59') });
    expect(stateOf('at-the-stove', { events, outcomes: [eaten] }).tier).toBe(1);
    const undone = [{ ...eaten, deletedAt: DELETED }];
    expect(stateOf('at-the-stove', { events, outcomes: undone }).tier).toBe(0);
    // An outcome of that item from another time is not this cooking.
    const other = [{ ...eaten, at: at('2026-09-20') }];
    expect(stateOf('at-the-stove', { events, outcomes: other }).tier).toBe(0);
  });

  it('a processed result that was deleted or whose ingredients were undone counts for nothing', () => {
    const ingredient = id();
    const cake = item({ origin: 'made', categoryId: 'bakery-homemade' });
    const events = [
      processed('2026-10-01', {
        ingredientIds: [ingredient],
        resultId: cake.id,
        kind: 'made',
        recipeId: 'r1',
      }),
    ];
    const outcomes = [outcome('2026-10-01', { itemId: ingredient, madeInto: cake.id })];
    const live = { events, items: [cake], outcomes };
    expect(stateOf('bakery', live).tier).toBe(1);
    expect(stateOf('at-the-stove', live).tier).toBe(1);
    const deleted = { events, items: [{ ...cake, deletedAt: DELETED }], outcomes };
    expect(stateOf('bakery', deleted).tier).toBe(0);
    expect(stateOf('at-the-stove', deleted).tier).toBe(0);
    const undone = {
      events,
      items: [cake],
      outcomes: [{ ...first(outcomes), deletedAt: DELETED }],
    };
    expect(stateOf('bakery', undone).tier).toBe(0);
  });

  it('«Backstube» wants a self-made result in a bakery category, not leftovers or a cooked dish', () => {
    const make = (kind: 'made' | 'leftover', categoryId: string) => {
      const result = item({ origin: kind, categoryId });
      return {
        result,
        event: processed('2026-10-01', { ingredientIds: [], resultId: result.id, kind }),
      };
    };
    const made = [
      make('made', 'bakery-bread'),
      make('made', 'bakery-homemade'),
      make('made', 'prepared-leftovers'),
      make('leftover', 'bakery-homemade'),
    ];
    const data = { items: made.map((entry) => entry.result), events: made.map((e) => e.event) };
    expect(stateOf('bakery', data).progress.current).toBe(2);
  });

  it('«Resteküche» counts leftovers verwertet or given away, not entsorgt, open or bought food', () => {
    const eaten = item({ origin: 'leftover', status: 'eaten' });
    const shared = item({ origin: 'leftover', status: 'shared_out' });
    const wasted = item({ origin: 'leftover', status: 'wasted' });
    const open = item({ origin: 'leftover' });
    const bought = item({ status: 'eaten' });
    const deleted = item({ origin: 'leftover', status: 'eaten', deletedAt: DELETED });
    const outcomes = [
      outcome('2026-10-01', { itemId: eaten.id }),
      outcome('2026-10-02', { itemId: shared.id, outcome: 'shared_out' }),
      outcome('2026-10-03', { itemId: wasted.id, outcome: 'wasted' }),
      outcome('2026-10-04', { itemId: bought.id }),
      outcome('2026-10-05', { itemId: deleted.id }),
    ];
    const items = [eaten, shared, wasted, open, bought, deleted];
    expect(stateOf('leftover-kitchen', { items, outcomes }).progress.current).toBe(2);
    // Undone: that leftover is at home again.
    const undone = [{ ...first(outcomes), deletedAt: DELETED }, ...outcomes.slice(1)];
    expect(
      stateOf('leftover-kitchen', { items: [...items], outcomes: undone }).progress.current,
    ).toBe(1);
  });

  it('«Eigenes Kochbuch» forgets recipes that were deleted', () => {
    const recipes = [
      { id: id(), createdAt: at('2026-10-01') },
      { id: id(), createdAt: at('2026-10-02'), deletedAt: DELETED },
    ];
    expect(stateOf('own-cookbook', { recipes })).toMatchObject({
      tier: 1,
      reachedOn: '2026-10-01',
      progress: { current: 1, next: 5 },
    });
  });
});
