import { describe, expect, it } from 'vitest';
import { localDate } from '@fridgeai/core';
import { outcomeText, planOutcome, rebuyText } from './settle';

const today = localDate('2026-11-12');

const item = (name: string, expiresOn: string, expiryKind: 'best_before' | 'use_by') => ({
  name,
  expiresOn: localDate(expiresOn),
  expiryKind,
  location: 'fridge' as const,
  // Came home long before: the «läuft bald ab» days count as at risk.
  purchasedAt: '2026-10-20T10:00:00.000Z',
});

describe('planOutcome', () => {
  const dueToday = item('Joghurt', '2026-11-12', 'best_before');
  const fresh = item('Butter', '2026-12-20', 'best_before');
  const useBy = item('Hackfleisch', '2026-11-12', 'use_by');

  it('asks the rescue question once for the food that was about to go off, when eaten', () => {
    const plan = planOutcome([dueToday, fresh], 'eaten', today);
    expect(plan.rescueQuestion).toEqual([dueToday]);
    expect(plan.askStillGood).toBe(false);
  });

  it('does not ask without such food', () => {
    expect(planOutcome([fresh], 'eaten', today).rescueQuestion).toEqual([]);
  });

  it('never asks the rescue question for thrown-away food', () => {
    expect(planOutcome([dueToday], 'wasted', today).rescueQuestion).toEqual([]);
  });

  it('hints «Ist das noch gut?» for thrown-away best-before food, not for use-by food', () => {
    expect(planOutcome([fresh, useBy], 'wasted', today).askStillGood).toBe(true);
    expect(planOutcome([useBy], 'wasted', today).askStillGood).toBe(false);
    expect(planOutcome([fresh], 'eaten', today).askStillGood).toBe(false);
  });
});

describe('toast texts', () => {
  it('names one item and counts several', () => {
    expect(outcomeText(['Joghurt'], 'eaten')).toBe('Joghurt verwertet.');
    expect(outcomeText(['Joghurt', 'Milch', 'Eier'], 'eaten')).toBe('3 Artikel verwertet.');
    expect(outcomeText(['Joghurt'], 'wasted')).toBe('Joghurt entsorgt.');
    expect(outcomeText(['Joghurt', 'Milch'], 'wasted')).toBe('2 Artikel entsorgt.');
  });

  it('says what went on the shopping list and what was there already', () => {
    expect(rebuyText(['Milch'], [])).toBe('Milch steht bei «Nachkaufen».');
    expect(rebuyText(['Milch', 'Eier', 'Brot'], [])).toBe('3 Artikel stehen bei «Nachkaufen».');
    expect(rebuyText([], ['Milch'])).toBe('Milch stand schon bei «Nachkaufen».');
    expect(rebuyText(['Eier'], ['Milch', 'Brot'])).toBe(
      'Eier steht bei «Nachkaufen». 2 Artikel standen schon bei «Nachkaufen».',
    );
  });
});
