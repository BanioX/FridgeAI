import { describe, expect, it } from 'vitest';
import {
  attentionOf,
  categoryById,
  localDate,
  rappen,
  priciestItemIds,
  type AttentionContext,
  type AttentionItem,
} from '../src';

const today = localDate('2026-11-13');
const none: AttentionContext = { today, priciestIds: new Set(), wastedTimes: new Map() };

const item = (overrides: Partial<AttentionItem> = {}): AttentionItem => ({
  id: 'i1',
  categoryId: 'dairy-butter',
  location: 'fridge',
  expiresOn: localDate('2026-12-20'),
  expiryKind: 'best_before',
  ...overrides,
});

const kinds = (result: ReturnType<typeof attentionOf>) =>
  result.reasons.map((reason) => reason.kind);

describe('attentionOf', () => {
  it('says nothing about a plain article', () => {
    expect(attentionOf(item(), none)).toEqual({ reasons: [] });
  });

  it('flags a Verbrauchsdatum today or tomorrow, not past (the row says that already)', () => {
    const use = { categoryId: 'dairy-butter', expiryKind: 'use_by' as const };
    expect(kinds(attentionOf(item({ ...use, expiresOn: localDate('2026-11-14') }), none))).toEqual([
      'use_by',
    ]);
    expect(kinds(attentionOf(item({ ...use, expiresOn: localDate('2026-11-13') }), none))).toEqual([
      'use_by',
    ]);
    expect(attentionOf(item({ ...use, expiresOn: localDate('2026-11-10') }), none).reasons).toEqual(
      [],
    );
    expect(attentionOf(item({ ...use, expiresOn: localDate('2026-11-15') }), none).reasons).toEqual(
      [],
    );
    expect(
      attentionOf(item({ expiryKind: 'best_before', expiresOn: localDate('2026-11-14') }), none)
        .reasons,
    ).toEqual([]);
  });

  it('flags a delicate food only once it is open (its date is in the row already)', () => {
    const mince = { categoryId: 'meat-minced' };
    expect(categoryById('meat-minced')).toBeDefined();
    expect(
      kinds(attentionOf(item({ ...mince, openedOn: localDate('2026-11-12') }), none)),
    ).toContain('perishable');
    // Sealed, even close to its date: no reason.
    expect(
      attentionOf(item({ ...mince, expiresOn: localDate('2026-11-14') }), none).reasons,
    ).toEqual([]);
  });

  it('flags a robust food only for its date, never as delicate', () => {
    const result = attentionOf(
      item({ openedOn: localDate('2026-11-12'), expiresOn: localDate('2026-11-14') }),
      none,
    );
    expect(kinds(result)).not.toContain('perishable');
  });

  it('flags the priciest articles from CHF 6.00 on', () => {
    const context = { ...none, priciestIds: new Set(['i1']) };
    const result = attentionOf(item({ priceRappen: 1290 }), context);
    expect(result.reasons).toEqual([{ kind: 'pricey', rappen: rappen(1290) }]);
    expect(attentionOf(item({ priceRappen: 590 }), context).reasons).toEqual([]);
    expect(attentionOf(item({ priceRappen: 1290 }), none).reasons).toEqual([]);
    expect(attentionOf(item(), context).reasons).toEqual([]);
  });

  it('flags a category the household often throws away', () => {
    const context = { ...none, wastedTimes: new Map([['dairy-butter', 3]]) };
    expect(attentionOf(item(), context).reasons).toEqual([{ kind: 'often_wasted', times: 3 }]);
    const once = { ...none, wastedTimes: new Map([['dairy-butter', 1]]) };
    expect(attentionOf(item(), once).reasons).toEqual([]);
  });

  it('orders by importance and shows at most two', () => {
    const context: AttentionContext = {
      today,
      priciestIds: new Set(['i1']),
      wastedTimes: new Map([['meat-minced', 4]]),
    };
    const result = attentionOf(
      item({
        categoryId: 'meat-minced',
        expiryKind: 'use_by',
        expiresOn: localDate('2026-11-14'),
        openedOn: localDate('2026-11-13'),
        priceRappen: 900,
      }),
      context,
    );
    expect(kinds(result)).toEqual(['use_by', 'perishable']);
    const pricey = attentionOf(
      item({ categoryId: 'meat-minced', expiresOn: localDate('2026-11-30'), priceRappen: 900 }),
      context,
    );
    expect(kinds(pricey)).toEqual(['pricey', 'often_wasted']);
  });

  it('never raises a date alarm for the freezer or the Notvorrat', () => {
    const base = {
      categoryId: 'meat-minced',
      expiryKind: 'use_by' as const,
      expiresOn: localDate('2026-11-14'),
      openedOn: localDate('2026-11-12'),
    };
    expect(attentionOf(item({ ...base, location: 'freezer' }), none).reasons).toEqual([]);
    expect(attentionOf(item({ ...base, location: 'reserve' }), none).reasons).toEqual([]);
  });

  it('still names a high price in the freezer', () => {
    const context = { ...none, priciestIds: new Set(['i1']) };
    const result = attentionOf(item({ location: 'freezer', priceRappen: 2000 }), context);
    expect(kinds(result)).toEqual(['pricey']);
  });

  it('gives the freeze tip for food that can be frozen and is not in the freezer', () => {
    const urgent = item({
      categoryId: 'meat-minced',
      expiryKind: 'use_by',
      expiresOn: localDate('2026-11-14'),
    });
    expect(attentionOf(urgent, none).tip).toEqual({ kind: 'freeze' });
  });

  it('gives no tip once the date is past: freezing no longer helps', () => {
    const context = { ...none, priciestIds: new Set(['i1']) };
    const past = item({
      categoryId: 'meat-minced',
      expiresOn: localDate('2026-11-12'),
      priceRappen: 900,
    });
    const result = attentionOf(past, context);
    expect(kinds(result)).toEqual(['pricey']);
    expect(result.tip).toBeUndefined();
  });

  it('gives the first category tip otherwise, or none', () => {
    const context = { ...none, priciestIds: new Set(['i1']) };
    const frozen = attentionOf(item({ location: 'freezer', priceRappen: 2000 }), context);
    const first = categoryById('dairy-butter')?.tips.de[0];
    expect(frozen.tip).toEqual(first === undefined ? undefined : { kind: 'category', text: first });
    expect(attentionOf(item(), none).tip).toBeUndefined();
  });
});

describe('priciestItemIds', () => {
  const priced = (id: string, priceRappen?: number) => ({ id, priceRappen });

  it('takes the three highest prices, ties included', () => {
    const ids = priciestItemIds([
      priced('a', 1000),
      priced('b', 900),
      priced('c', 800),
      priced('d', 800),
      priced('e', 700),
      priced('f'),
    ]);
    expect([...ids].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('never includes articles under CHF 6.00', () => {
    expect([...priciestItemIds([priced('a', 599), priced('b', 600)])]).toEqual(['b']);
  });

  it('is empty without prices', () => {
    expect(priciestItemIds([priced('a')]).size).toBe(0);
  });
});
