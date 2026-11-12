import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { parseExpiryFromText } from '../src/expiry-from-text';

const today = localDate('2026-11-12');
const parse = (text: string) => parseExpiryFromText(text, today);

describe('parseExpiryFromText: formats', () => {
  it.each([
    ['14.12.2026', '2026-12-14'],
    ['14.12.26', '2026-12-14'],
    ['14/12/26', '2026-12-14'],
    ['14/12/2026', '2026-12-14'],
    ['14-12-26', '2026-12-14'],
    ['14-12-2026', '2026-12-14'],
    ['14 . 12 . 2026', '2026-12-14'],
    ['14 / 12 / 26', '2026-12-14'],
    ['4.1.27', '2027-01-04'],
  ])('reads %s', (text, expected) => {
    expect(parse(text)).toEqual({ date: expected });
  });

  it.each([
    ['03.2027', '2027-03-31'],
    ['02/28', '2028-02-29'],
    ['12.26', '2026-12-31'],
    ['11.2026', '2026-11-30'],
  ])('reads month and year only (%s) as the last day of the month', (text, expected) => {
    expect(parse(text)).toEqual({ date: expected });
  });
});

describe('parseExpiryFromText: OCR slips', () => {
  it.each([
    ['l4.l2.2O26', '2026-12-14'],
    ['I4.12.2026', '2026-12-14'],
    ['|4.12.2026', '2026-12-14'],
    ['14.12.2o26', '2026-12-14'],
    ['14.12.2O26', '2026-12-14'],
    ['S.01.2027', '2027-01-05'],
    ['2B.12.2026', '2026-12-28'],
    ['O4.12.2026', '2026-12-04'],
  ])('fixes %s', (text, expected) => {
    expect(parse(text)).toEqual({ date: expected });
  });

  it('does not turn letters in words into digits', () => {
    expect(parse('BIO SOLL 10 STUECK')).toBeNull();
    expect(parse('Sol.Ob.2027')).toBeNull();
  });
});

describe('parseExpiryFromText: plausible range', () => {
  it('rejects days that do not exist', () => {
    expect(parse('31.02.2027')).toBeNull();
    expect(parse('29.02.2027')).toBeNull();
    expect(parse('31.04.2027')).toBeNull();
    expect(parse('32.01.2027')).toBeNull();
    expect(parse('14.13.2027')).toBeNull();
  });

  it('accepts a leap day in a leap year', () => {
    expect(parse('29.02.2028')).toEqual({ date: '2028-02-29' });
  });

  it('rejects a date more than 10 years ahead, accepts exactly 10 years', () => {
    expect(parse('12.11.2036')).toEqual({ date: '2036-11-12' });
    expect(parse('13.11.2036')).toBeNull();
  });

  it('takes today and later, ignores a production date in the past', () => {
    expect(parse('12.11.2026')).toEqual({ date: '2026-11-12' });
    expect(parse('11.11.2026')).toBeNull();
    expect(parse('GEPACKT 02.11.2026')).toBeNull();
    expect(parse('02.11.2026\n14.12.2026')).toEqual({ date: '2026-12-14' });
  });

  it('does not take a month in the past as an expiry', () => {
    expect(parse('10.2026')).toBeNull();
  });
});

describe('parseExpiryFromText: keywords', () => {
  it.each([
    ['Mindestens haltbar bis 14.12.2027', 'best_before'],
    ['MINDESTENS HALTBAR BIS 14.12.2027', 'best_before'],
    ['Mind. haltbar: 14.12.2027', 'best_before'],
    ['MHD 14.12.2027', 'best_before'],
    ['mhd: 14.12.27', 'best_before'],
    ['Haltbar bis 14.12.2027', 'best_before'],
    ['Zu verbrauchen bis 14.12.2027', 'use_by'],
    ['verbrauchen bis 14.12.2027', 'use_by'],
    ['Verbrauchsdatum 14.12.2027', 'use_by'],
    ['À consommer de préférence avant le 14.12.2027', 'best_before'],
    ['A CONSOMMER DE PREFERENCE AVANT 14.12.2027', 'best_before'],
    ["À consommer jusqu'au 14.12.2027", 'use_by'],
    ['Da consumarsi preferibilmente entro 14.12.2027', 'best_before'],
    ['Da consumarsi entro 14.12.2027', 'use_by'],
    ['Best before 14.12.2027', 'best_before'],
    ['USE BY 14.12.2027', 'use_by'],
  ])('names the kind for «%s»', (text, kind) => {
    expect(parse(text)).toEqual({ date: '2027-12-14', kind });
  });

  it('gives a date without a kind for EXP', () => {
    expect(parse('EXP 14.12.2027')).toEqual({ date: '2027-12-14' });
  });

  it('does not take «exp» inside a word for a keyword', () => {
    expect(parse('Express 14.12.2027')).toEqual({ date: '2027-12-14' });
  });

  it('lets the keyword date win over an earlier date', () => {
    expect(parse('15.11.2026\nMHD 14.12.2027')).toEqual({
      date: '2027-12-14',
      kind: 'best_before',
    });
  });

  it('reads a date that stands before its keyword on the same line', () => {
    expect(parse('14.12.2027 MHD')).toEqual({ date: '2027-12-14', kind: 'best_before' });
  });

  it('reads a date on the line after a keyword that ends its line', () => {
    expect(parse('Zu verbrauchen bis\n14.12.2027')).toEqual({ date: '2027-12-14', kind: 'use_by' });
    expect(parse('Mindestens haltbar\nbis 14.12.2027')).toEqual({
      date: '2027-12-14',
      kind: 'best_before',
    });
  });

  it('does not hand a keyword down to a date on a line that has its own date above', () => {
    // The first line has a date of its own, so the keyword does not reach the second line.
    expect(parse('MHD 14.12.2027\n20.12.2026')).toEqual({
      date: '2027-12-14',
      kind: 'best_before',
    });
  });

  it('keeps the earliest of several keyword dates', () => {
    expect(parse('MHD 14.12.2027\nVerbrauchen bis 20.12.2026')).toEqual({
      date: '2026-12-20',
      kind: 'use_by',
    });
  });

  it('falls back to a plain date when the keyword date is in the past', () => {
    expect(parse('MHD 01.01.2020\n14.12.2026')).toEqual({ date: '2026-12-14' });
  });

  it('still answers with a keyword date a few days past (within 30 days)', () => {
    expect(parse('MHD 05.11.2026')).toEqual({ date: '2026-11-05', kind: 'best_before' });
  });
});

describe('parseExpiryFromText: choosing without a keyword', () => {
  it('takes the earliest date from today on', () => {
    expect(parse('14.12.2027 20.01.2027 05.03.2028')).toEqual({ date: '2027-01-20' });
    expect(parse('14.12.2027\n20.01.2027')).toEqual({ date: '2027-01-20' });
  });

  it('prefers a full date over a month and year, which a price can imitate', () => {
    expect(parse('CHF 11.27\n14.12.2027')).toEqual({ date: '2027-12-14' });
  });

  it('returns null without any date', () => {
    expect(parse('')).toBeNull();
    expect(parse('Bio Vollmilch 1 Liter')).toBeNull();
  });
});

describe('parseExpiryFromText: noise', () => {
  it('ignores a lot code', () => {
    expect(parse('L23114')).toBeNull();
    expect(parse('L23114 MHD 14.12.2027')).toEqual({ date: '2027-12-14', kind: 'best_before' });
    expect(parse('LOT 23.114')).toBeNull();
    expect(parse('L2311420')).toBeNull();
  });

  it('ignores prices', () => {
    expect(parse('Fr. 3.95')).toBeNull();
    expect(parse('CHF 3.95')).toBeNull();
    expect(parse('12.50')).toBeNull();
    expect(parse('1.20')).toBeNull();
  });

  it('ignores digits that are glued to words', () => {
    expect(parse('A14.12.2027')).toBeNull();
    expect(parse('14.12.2027A')).toBeNull();
  });

  it('handles windows line endings', () => {
    expect(parse('MHD\r\n14.12.2027\r\n')).toEqual({ date: '2027-12-14', kind: 'best_before' });
  });
});
