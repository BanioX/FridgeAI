import { describe, expect, it } from 'vitest';
import { adviseFreezing, itemBadges, localDate, type BadgeSource } from '../src';

const today = localDate('2026-11-11');
const base: BadgeSource = { location: 'fridge', categoryId: 'dairy-milk' };

describe('itemBadges', () => {
  it('shows Selbst gemacht and Reste from the origin, first in order', () => {
    expect(itemBadges({ ...base, origin: 'made' }, today)).toEqual([{ kind: 'made' }]);
    expect(itemBadges({ ...base, origin: 'leftover' }, today)).toEqual([{ kind: 'leftover' }]);
    const openedOn = localDate('2026-11-10');
    expect(itemBadges({ ...base, origin: 'made', openedOn }, today)).toEqual([
      { kind: 'made' },
      { kind: 'opened', on: openedOn },
    ]);
  });

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

  it('shows Geöffnet, and Von der Theke instead for an item bought at the counter', () => {
    const openedOn = localDate('2026-11-10');
    expect(itemBadges({ ...base, openedOn }, today)).toEqual([{ kind: 'opened', on: openedOn }]);
    const counter = { ...base, categoryId: 'dairy-cheese-soft', openedOn, fromCounter: true };
    expect(itemBadges(counter, today)).toEqual([{ kind: 'loose' }]);
  });

  it('shows Geöffnet for a pack opened at home on the day it came home (Alban, 12.11.2026)', () => {
    // A sealed mozzarella, bought and opened the same day: no counter, whatever the category.
    const openedOn = localDate('2026-11-09');
    const sealed = { ...base, categoryId: 'dairy-cheese-soft', openedOn };
    expect(itemBadges(sealed, today)).toEqual([{ kind: 'opened', on: openedOn }]);
    expect(itemBadges({ ...sealed, fromCounter: false }, today)).toEqual([
      { kind: 'opened', on: openedOn },
    ]);
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
