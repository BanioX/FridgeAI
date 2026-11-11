import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { shouldAskStillGood, shouldSuggestFreezing } from '../src/rescue-tips';

const today = localDate('2026-11-11');

describe('shouldAskStillGood', () => {
  it('asks for best-before dates only, never for use-by dates', () => {
    expect(shouldAskStillGood({ expiryKind: 'best_before' })).toBe(true);
    expect(shouldAskStillGood({ expiryKind: 'use_by' })).toBe(false);
  });
});

describe('shouldSuggestFreezing', () => {
  const minced = { location: 'fridge', categoryId: 'meat-minced' } as const;

  it.each([
    ['2026-11-11', true],
    ['2026-11-12', true],
    ['2026-11-13', false],
    ['2026-11-10', false],
  ])('fridge item due %s: %s', (expiresOn, expected) => {
    expect(shouldSuggestFreezing({ ...minced, expiresOn: localDate(expiresOn) }, today)).toBe(
      expected,
    );
  });

  it('stays quiet outside the fridge', () => {
    const expiresOn = localDate('2026-11-12');
    expect(shouldSuggestFreezing({ ...minced, location: 'freezer', expiresOn }, today)).toBe(false);
    expect(shouldSuggestFreezing({ ...minced, location: 'pantry', expiresOn }, today)).toBe(false);
  });

  it('stays quiet for food that cannot be frozen and for unknown categories', () => {
    const expiresOn = localDate('2026-11-12');
    expect(
      shouldSuggestFreezing(
        { location: 'fridge', categoryId: 'produce-cucumber', expiresOn },
        today,
      ),
    ).toBe(false);
    expect(
      shouldSuggestFreezing({ location: 'fridge', categoryId: 'does-not-exist', expiresOn }, today),
    ).toBe(false);
  });
});
