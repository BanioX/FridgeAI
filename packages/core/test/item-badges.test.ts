import { describe, expect, it } from 'vitest';
import { adviseFreezing, IsoDateTimeSchema, itemBadges, localDate, type BadgeSource } from '../src';

const today = localDate('2026-11-11');
const bought = IsoDateTimeSchema.parse('2026-11-09T10:00:00.000Z');
const base: BadgeSource = { location: 'fridge', categoryId: 'dairy-milk', purchasedAt: bought };

describe('itemBadges', () => {
  it('has none for a plain item', () => {
    expect(itemBadges(base, today)).toEqual([]);
  });

  it('shows Eingefroren from the location, not only from frozenOn', () => {
    const frozenOn = localDate('2026-11-03');
    expect(itemBadges({ ...base, location: 'freezer', frozenOn }, today)).toEqual([
      { kind: 'frozen', on: frozenOn },
    ]);
    // frozenOn left over after an undo of freezing
    expect(itemBadges({ ...base, frozenOn }, today)).toEqual([]);
  });

  it('shows Aufgetaut only outside the freezer', () => {
    const thawedOn = localDate('2026-11-10');
    expect(itemBadges({ ...base, thawedOn }, today)).toEqual([{ kind: 'thawed', on: thawedOn }]);
    expect(itemBadges({ ...base, location: 'freezer', thawedOn }, today)).toEqual([]);
  });

  it('shows Geöffnet, and Von der Theke instead when opened on the day it came home', () => {
    const openedOn = localDate('2026-11-10');
    expect(itemBadges({ ...base, openedOn }, today)).toEqual([{ kind: 'opened', on: openedOn }]);
    const loose = { ...base, categoryId: 'dairy-cheese-soft', openedOn: localDate('2026-11-09') };
    expect(itemBadges(loose, today)).toEqual([{ kind: 'loose' }]);
    // the same category, opened later: an ordinary open pack
    expect(itemBadges({ ...loose, openedOn }, today)).toEqual([{ kind: 'opened', on: openedOn }]);
  });

  it('shows Fertigprodukt from the category or from the item, and the item wins', () => {
    const dessert = { ...base, categoryId: 'prepared-desserts' };
    expect(itemBadges(dessert, today)).toEqual([{ kind: 'ready' }]);
    expect(itemBadges({ ...base, readyMade: true }, today)).toEqual([{ kind: 'ready' }]);
    expect(itemBadges({ ...dessert, readyMade: false }, today)).toEqual([]);
    const opened = { ...dessert, openedOn: localDate('2026-11-10') };
    expect(itemBadges(opened, today).map((badge) => badge.kind)).toEqual(['ready', 'opened']);
  });

  it('keeps the order and ignores days in the future', () => {
    const all = itemBadges(
      {
        ...base,
        location: 'freezer',
        frozenOn: localDate('2026-11-03'),
        openedOn: localDate('2026-11-10'),
      },
      today,
    );
    expect(all.map((badge) => badge.kind)).toEqual(['frozen', 'opened']);
    expect(itemBadges({ ...base, thawedOn: localDate('2026-11-12') }, today)).toEqual([]);
  });
});

describe('adviseFreezing', () => {
  it('splits unsuitable from suitable items and gives the reason of the category', () => {
    const items = [
      { id: 'a', categoryId: 'produce-salad' },
      { id: 'b', categoryId: 'meat-minced' },
      { id: 'c', categoryId: 'produce-onions' },
    ];
    const advice = adviseFreezing(items);
    expect(advice.suitable.map((item) => item.id)).toEqual(['b']);
    expect(advice.unsuitable.map((entry) => entry.item.id)).toEqual(['a', 'c']);
    expect(advice.unsuitable[0]?.note).toBe('Salat wird beim Auftauen matschig.');
    expect(advice.unsuitable[1]?.note).toBeUndefined();
  });
});
