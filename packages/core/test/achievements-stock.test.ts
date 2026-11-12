import { describe, expect, it } from 'vitest';
import { addDays, localDate, rappen, type AchievementItem, type Id } from '../src';
import { at, DELETED, event, id, item, outcome, stateOf, first } from './achievements-fixtures';

/** Vorrat (docs/abzeichen.md, «Regeln im Detail»): freezing, receipts, checks, overview, Notvorrat. */
describe('«Vorausschauend»', () => {
  const freeze = (
    target: AchievementItem,
    date: string,
    previousExpiresOn?: string,
    from: 'fridge' | 'freezer' | 'pantry' = 'fridge',
  ) =>
    event('item.moved', date, {
      itemId: target.id,
      from,
      to: 'freezer',
      expiresOn: localDate('2027-01-31'),
      ...(previousExpiresOn === undefined
        ? {}
        : { previousExpiresOn: localDate(previousExpiresOn) }),
    });

  it('counts a freeze on or before the date, one per item', () => {
    const early = item();
    const onDay = item();
    const late = item();
    const old = item();
    const twice = item();
    const gone = item({ deletedAt: DELETED });
    const events = [
      freeze(early, '2026-10-01', '2026-10-05'),
      freeze(onDay, '2026-10-05', '2026-10-05'),
      freeze(late, '2026-10-06', '2026-10-05'),
      // A move from before the old date was recorded: it counts, the app cannot tell.
      freeze(old, '2026-10-02'),
      freeze(twice, '2026-10-02', '2026-10-09'),
      freeze(twice, '2026-10-04', '2026-10-09'),
      freeze(gone, '2026-10-02', '2026-10-09'),
      // Out of the freezer is no freezing.
      freeze(late, '2026-10-07', '2026-10-09', 'freezer'),
    ];
    const items = [early, onDay, late, old, twice, gone];
    expect(stateOf('foresight', { items, events }).progress.current).toBe(4);
  });
});

describe('«Buchhaltung»', () => {
  it('counts each receipt once and forgets deleted ones', () => {
    const kept = id();
    const removed = id();
    const imported = (receiptId: Id, date: string) =>
      event('receipt.imported', date, {
        receiptId,
        retailer: 'migros',
        lineCount: 2,
        totalRappen: rappen(500),
      });
    const events = [
      imported(kept, '2026-10-01'),
      imported(kept, '2026-10-02'),
      imported(removed, '2026-10-03'),
    ];
    const receipts = [{ id: kept }, { id: removed, deletedAt: DELETED }];
    expect(stateOf('bookkeeping', { events, receipts })).toMatchObject({
      tier: 1,
      reachedOn: '2026-10-01',
      progress: { current: 1, next: 10 },
    });
  });
});

describe('«Treu»', () => {
  const check = (date: string) => event('check.completed', date, { itemCount: 5 });
  // Mondays; the default today, 2026-11-12, is a Thursday.
  const weeks = (mondays: string[], dayOffset = 0) =>
    mondays.map((monday) => check(addDays(localDate(monday), dayOffset)));
  const four = ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26'];

  it('needs four weeks in a row for tier I, with one check in each week', () => {
    expect(stateOf('loyal', { events: weeks(four.slice(0, 3)) }).tier).toBe(0);
    expect(stateOf('loyal', { events: weeks(four) })).toMatchObject({
      tier: 1,
      reachedOn: '2026-10-26',
      progress: { current: 0, next: 12 },
    });
  });

  it('counts weeks from Monday to Sunday', () => {
    expect(stateOf('loyal', { events: weeks(four, 6) }).tier).toBe(1);
    // Sunday 4.10. is in the week of 28.9.; with 12.10. and 19.10. there is a gap in between.
    const seam = [check('2026-10-04'), check('2026-10-12'), check('2026-10-19')];
    expect(stateOf('loyal', { events: seam }).tier).toBe(0);
    expect(stateOf('loyal', { events: [...weeks(four.slice(1)), check('2026-10-11')] }).tier).toBe(
      1,
    );
  });

  it('counts several checks in one week once; a missed week breaks the run', () => {
    expect(stateOf('loyal', { events: [...weeks(four), ...weeks(four, 2)] }).tier).toBe(1);
    const gap = weeks(['2026-10-05', '2026-10-12', '2026-10-26', '2026-11-02']);
    expect(stateOf('loyal', { events: gap }).tier).toBe(0);
  });

  it('keeps the tier once reached, and shows the running run as progress', () => {
    const run = weeks([...four, '2026-11-02']);
    // The week from 9.11. is still open: «diese Woche noch offen» does not break the run.
    expect(stateOf('loyal', { events: run }).progress.current).toBe(5);
    expect(stateOf('loyal', { events: run }, localDate('2026-11-15')).progress.current).toBe(5);
    // A whole week without a check: the run is over, the tier stays.
    const later = stateOf('loyal', { events: run }, localDate('2026-11-23'));
    expect(later).toMatchObject({ tier: 1, progress: { current: 0, next: 12 } });
  });

  it('reaches tier III after 52 weeks', () => {
    const mondays = Array.from({ length: 52 }, (_, i) => addDays(localDate('2025-11-03'), i * 7));
    const today = localDate('2026-11-05');
    expect(stateOf('loyal', { events: weeks(mondays) }, today)).toMatchObject({
      tier: 3,
      reachedOn: '2026-10-26',
      progress: { next: null },
    });
    expect(stateOf('loyal', { events: weeks(mondays.slice(1)) }, today).tier).toBe(2);
  });
});

describe('«Alles im Blick»', () => {
  const today = localDate('2026-11-30');
  /** Ten closings in the first days, then a quiet fridge up to today. */
  const closings = () =>
    Array.from({ length: 10 }, (_, i) => outcome(`2026-11-${String(i + 1).padStart(2, '0')}`));

  it('is reached after 30 clean days with ten closings', () => {
    expect(stateOf('overview', { outcomes: closings() }, today)).toMatchObject({
      tier: 1,
      reachedOn: '2026-11-30',
      progress: { next: null },
    });
    expect(stateOf('overview', { outcomes: closings() }, localDate('2026-11-29'))).toMatchObject({
      tier: 0,
      progress: { current: 29, next: 30 },
    });
  });

  it('needs ten closings in the period', () => {
    expect(stateOf('overview', { outcomes: closings().slice(1) }, today).tier).toBe(0);
  });

  it('is blocked by a fridge item left over its date', () => {
    const forgotten = item({ expiresOn: localDate('2026-11-20') });
    const state = stateOf('overview', { outcomes: closings(), items: [forgotten] }, today);
    expect(state.tier).toBe(0);
    // Still over its date today: the clean days start again.
    expect(state.progress.current).toBe(0);
  });

  it('allows an item closed on the day of its date, but not one closed a day after', () => {
    const closed = item({ expiresOn: localDate('2026-11-20'), status: 'eaten' });
    const onTime = [...closings(), outcome('2026-11-20', { itemId: closed.id })];
    expect(stateOf('overview', { outcomes: onTime, items: [closed] }, today).tier).toBe(1);
    const slow = [...closings(), outcome('2026-11-21', { itemId: closed.id })];
    expect(stateOf('overview', { outcomes: slow, items: [closed] }, today).tier).toBe(0);
  });

  it('is blocked by food thrown away as «abgelaufen», not by other reasons', () => {
    const expired = item({ expiresOn: localDate('2026-11-20'), status: 'wasted' });
    const asExpired = outcome('2026-11-20', {
      itemId: expired.id,
      outcome: 'wasted',
      wasteReason: 'expired',
    });
    const blocked = { outcomes: [...closings(), asExpired], items: [expired] };
    expect(stateOf('overview', blocked, today).tier).toBe(0);
    const spoiled = { ...asExpired, wasteReason: 'did_not_like' as const };
    const fine = { outcomes: [...closings(), spoiled], items: [expired] };
    expect(stateOf('overview', fine, today).tier).toBe(1);
  });

  it('ignores items in the pantry and deleted items', () => {
    const pantry = item({ location: 'pantry', expiresOn: localDate('2026-11-20') });
    const gone = item({ expiresOn: localDate('2026-11-20'), deletedAt: DELETED });
    expect(stateOf('overview', { outcomes: closings(), items: [pantry, gone] }, today).tier).toBe(
      1,
    );
  });

  it('forgets a closing that was undone', () => {
    const outcomes = closings();
    outcomes[0] = { ...first(outcomes), deletedAt: DELETED };
    expect(stateOf('overview', { outcomes }, today).tier).toBe(0);
  });
});

describe('«Überlebenskunst»', () => {
  const water = (litres: number, fields: Partial<AchievementItem> = {}) =>
    item({
      categoryId: 'reserve-water',
      location: 'reserve',
      unit: 'ml',
      quantity: litres * 1000,
      ...fields,
    });
  const food = (categoryId: string, fields: Partial<AchievementItem> = {}) =>
    item({ categoryId, location: 'reserve', ...fields });
  const four = () => [
    food('pantry-rice'),
    food('pantry-oil'),
    food('pantry-canned'),
    food('pantry-flour'),
  ];

  it('wants 9 litres per member and four food groups in the Notvorrat', () => {
    expect(stateOf('survival', { items: [water(9), ...four()] })).toMatchObject({
      tier: 1,
      progress: { current: 2, next: null },
    });
    expect(stateOf('survival', { items: [water(8.9), ...four()] })).toMatchObject({
      tier: 0,
      progress: { current: 1, next: 2 },
    });
    expect(stateOf('survival', { items: [water(9), ...four().slice(1)] })).toMatchObject({
      tier: 0,
      progress: { current: 1 },
    });
  });

  it('scales the water with the members of the household', () => {
    expect(stateOf('survival', { items: [water(9), ...four()], memberCount: 2 }).tier).toBe(0);
    expect(stateOf('survival', { items: [water(18), ...four()], memberCount: 2 }).tier).toBe(1);
  });

  it('counts rice and pasta as one group, and Fertiges as the fifth', () => {
    const items = [
      water(9),
      food('pantry-rice'),
      food('pantry-pasta'),
      food('pantry-oil'),
      food('reserve-rations'),
    ];
    expect(stateOf('survival', { items }).tier).toBe(0);
    expect(stateOf('survival', { items: [...items, food('pantry-flour')] }).tier).toBe(1);
    expect(stateOf('survival', { items: [...items, food('reserve-freeze-dried')] }).tier).toBe(0);
  });

  it('reads pieces with a pack size, and ignores what is elsewhere, deleted or used up', () => {
    const sixPack = water(0, {
      unit: 'pcs',
      quantity: 6,
      packageSize: { amount: 1500, unit: 'ml' },
    });
    expect(stateOf('survival', { items: [sixPack, ...four()] }).tier).toBe(1);
    const wrongPlace = { ...first(four()), location: 'pantry' as const };
    const elsewhere = [sixPack, wrongPlace, ...four().slice(1)];
    expect(stateOf('survival', { items: elsewhere }).tier).toBe(0);
    const gone = { ...sixPack, deletedAt: DELETED };
    expect(stateOf('survival', { items: [gone, ...four()] }).tier).toBe(0);
    const used = { ...sixPack, status: 'eaten' as const };
    expect(stateOf('survival', { items: [used, ...four()] }).tier).toBe(0);
  });

  it('is reached on the day the last needed piece arrived in the Notvorrat', () => {
    const oil = food('pantry-oil', { purchasedAt: at('2026-09-01') });
    const flour = food('pantry-flour', { purchasedAt: at('2026-05-01') });
    const canned = food('pantry-canned', { purchasedAt: at('2026-06-01') });
    const rice = food('pantry-rice', { purchasedAt: at('2026-07-01') });
    const bottles = water(9, { purchasedAt: at('2026-04-01') });
    const items = [oil, flour, canned, rice, bottles];
    expect(stateOf('survival', { items }).reachedOn).toBe('2026-09-01');
    // Bought long ago, moved into the Notvorrat later.
    const moved = event('item.moved', '2026-10-15', {
      itemId: flour.id,
      from: 'pantry',
      to: 'reserve',
      expiresOn: localDate('2027-10-15'),
    });
    expect(stateOf('survival', { items, events: [moved] }).reachedOn).toBe('2026-10-15');
  });
});
