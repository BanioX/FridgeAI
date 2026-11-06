import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { extractExpiryFromLabel } from '../src/scan/label';

const today = localDate('2026-11-06');

function read(text: string) {
  return extractExpiryFromLabel(text, today);
}

describe('extractExpiryFromLabel: keywords', () => {
  it('reads a best-before date after the German MHD phrase', () => {
    expect(read('Mindestens haltbar bis: 12.03.2027')).toEqual({
      expiresOn: localDate('2027-03-12'),
      kind: 'best_before',
      confidence: 'keyword',
    });
  });

  it('reads a use-by date with a two-digit year', () => {
    expect(read('zu verbrauchen bis 09.11.26')).toEqual({
      expiresOn: localDate('2026-11-09'),
      kind: 'use_by',
      confidence: 'keyword',
    });
  });

  it('reads a trilingual block with the date on the next line', () => {
    expect(
      read("Zu verbrauchen bis / A consommer jusqu'au / Da consumare entro:\n09.11.2026"),
    ).toEqual({
      expiresOn: localDate('2026-11-09'),
      kind: 'use_by',
      confidence: 'keyword',
    });
  });

  it('reads a trilingual block spread over several lines', () => {
    const text = "Zu verbrauchen bis\nÀ consommer jusqu'au\nDa consumare entro\n09.11.2026";
    expect(read(text)?.expiresOn).toBe(localDate('2026-11-09'));
    expect(read(text)?.kind).toBe('use_by');
  });

  it('ignores the packed-on date', () => {
    expect(read('Verpackt am 01.11.2026  Zu verbrauchen bis 08.11.2026')).toEqual({
      expiresOn: localDate('2026-11-08'),
      kind: 'use_by',
      confidence: 'keyword',
    });
  });

  it('reads MHD with month and year as end of month', () => {
    expect(read('MHD 11.2027')).toEqual({
      expiresOn: localDate('2027-11-30'),
      kind: 'best_before',
      confidence: 'keyword',
    });
  });

  it('leaves the kind open for EXP', () => {
    const result = read('EXP 2027-01-15');
    expect(result).toEqual({ expiresOn: localDate('2027-01-15'), confidence: 'keyword' });
    expect(result?.kind).toBeUndefined();
  });

  it('reads best before end with mm/yy', () => {
    expect(read('best before end 06/27')).toEqual({
      expiresOn: localDate('2027-06-30'),
      kind: 'best_before',
      confidence: 'keyword',
    });
  });

  it('tolerates OCR confusions inside the date', () => {
    expect(read('mind. haltbar bis 3l.l2.2O26')).toEqual({
      expiresOn: localDate('2026-12-31'),
      kind: 'best_before',
      confidence: 'keyword',
    });
  });

  it('tolerates mixed case, extra spaces and missing accents', () => {
    expect(read('A  CONSOMMER   DE PREFERENCE AVANT 15/01/2027')).toEqual({
      expiresOn: localDate('2027-01-15'),
      kind: 'best_before',
      confidence: 'keyword',
    });
    expect(read('à consommer jusqu’au 15-01-2027')?.kind).toBe('use_by');
  });

  it('reads the Italian best-before phrase and use-by', () => {
    expect(read('Da consumarsi preferibilmente entro 03.2027')?.kind).toBe('best_before');
    expect(read('Da consumare entro 5.12.26')).toEqual({
      expiresOn: localDate('2026-12-05'),
      kind: 'use_by',
      confidence: 'keyword',
    });
  });

  it('reads English use by, BBE and dates with spaces', () => {
    expect(read('Use by 09 11 26')?.expiresOn).toBe(localDate('2026-11-09'));
    expect(read('BBE 01.02.2027')?.kind).toBe('best_before');
    expect(read('Verbr. bis 09.11.2026')?.kind).toBe('use_by');
    expect(read('Ablaufdatum 09.11.2026')?.kind).toBeUndefined();
    expect(read('Expiry date 09.11.2026')?.expiresOn).toBe(localDate('2026-11-09'));
    expect(read('Exp. 09.11.2026')?.expiresOn).toBe(localDate('2026-11-09'));
  });

  it('prefers use-by over best-before when they point to different dates', () => {
    expect(read('MHD 20.12.2026\nZu verbrauchen bis 12.12.2026')).toEqual({
      expiresOn: localDate('2026-12-12'),
      kind: 'use_by',
      confidence: 'keyword',
    });
    expect(read('MHD 20.12.2026 zu verbrauchen bis 25.12.2026')?.expiresOn).toBe(
      localDate('2026-12-25'),
    );
  });

  it('prefers best-before over an unknown kind', () => {
    expect(read('EXP 01.12.2026 MHD 20.12.2026')).toEqual({
      expiresOn: localDate('2026-12-20'),
      kind: 'best_before',
      confidence: 'keyword',
    });
  });

  it('takes the earliest date on equal rank', () => {
    expect(read('MHD 20.12.2026 BBE 10.12.2026')?.expiresOn).toBe(localDate('2026-12-10'));
  });

  it('prefers the longer keyword at the same position', () => {
    expect(read('Mindestens haltbar bis 12.03.2027')?.kind).toBe('best_before');
    expect(read('Zu verbrauchen bis 12.03.2027')?.kind).toBe('use_by');
  });

  it('does not reach past one line break to unrelated text', () => {
    expect(read('MHD\nSiehe Deckel\n12.03.2027')).toEqual({
      expiresOn: localDate('2027-03-12'),
      confidence: 'single_date',
    });
  });

  it('lets the closest keyword decide when a lot number sits in between', () => {
    expect(read('MHD Lot 12.10.2026')).toBeNull();
    expect(read('Lot MHD 12.10.2026')?.kind).toBe('best_before');
  });

  it('ignores other production keywords in all languages', () => {
    for (const keyword of [
      'abgepackt am',
      'hergestellt am',
      'produziert am',
      'packed on',
      'produced on',
      'emballé le',
      'emballe le',
      'fabriqué le',
      'fabrique le',
      'confezionato il',
      'prodotto il',
      'Charge',
    ]) {
      expect(read(`${keyword} 12.10.2026`)).toBeNull();
    }
  });

  it('handles Windows line breaks', () => {
    expect(read('MHD\r\n12.03.2027')?.kind).toBe('best_before');
  });
});

describe('extractExpiryFromLabel: fallback and rejects', () => {
  it('rejects prices and weights', () => {
    expect(read('Preis 3.95  Gewicht 500 g')).toBeNull();
  });

  it('rejects day and month without a year', () => {
    expect(read('MHD 12.03')).toBeNull();
    expect(read('12.03.')).toBeNull();
  });

  it('rejects a lone lot date', () => {
    expect(read('Lot 12.10.2026')).toBeNull();
  });

  it('rejects ambiguous labels without keywords', () => {
    expect(read('12.10.2026 und 20.10.2026')).toBeNull();
  });

  it('accepts a repeated identical date as one', () => {
    expect(read('12.10.2026 und 12.10.2026')?.expiresOn).toBe(localDate('2026-10-12'));
  });

  it('uses the only date on the label as single_date', () => {
    expect(read('Inhalt 250 g\n15.12.2026')).toEqual({
      expiresOn: localDate('2026-12-15'),
      confidence: 'single_date',
    });
  });

  it('drops the packed date and keeps the one remaining date', () => {
    expect(read('Verpackt am 01.11.2026\n15.12.2026')).toEqual({
      expiresOn: localDate('2026-12-15'),
      confidence: 'single_date',
    });
  });

  it('ignores impossible calendar dates', () => {
    expect(read('MHD 31.02.2027')).toBeNull();
    expect(read('MHD 31.02.2027 und 01.03.2027')?.expiresOn).toBe(localDate('2027-03-01'));
  });

  it('does not take words with l/I/O as dates', () => {
    expect(read('Il.Il.Ill ooo')).toBeNull();
  });

  it('returns null for empty or date-free text', () => {
    expect(read('')).toBeNull();
    expect(read('   \n  ')).toBeNull();
    expect(read('Frische Vollmilch, pasteurisiert')).toBeNull();
  });

  it('never throws on odd input', () => {
    const noise = Array.from({ length: 10_000 }, (_, i) =>
      String.fromCharCode(32 + ((i * 7919) % 95)),
    ).join('');
    expect(() => read(noise)).not.toThrow();
    expect(() => read('MHD '.repeat(3000))).not.toThrow();
    expect(() => read('\n'.repeat(5000) + 'MHD 12.03.2027')).not.toThrow();
    expect(() => read('😀 日本語 ñ \ud800 MHD 12.03.2027')).not.toThrow();
    expect(read('😀 日本語 MHD 12.03.2027')?.expiresOn).toBe(localDate('2027-03-12'));
  });
});
