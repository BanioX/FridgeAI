import { buildReport, localDate, rappen } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { CHF_MONEY } from '../../app/money-format';
import { receiptSpec, usesPeriod, type QuickKind, type ReportKind } from './receipt-spec';
import { sampleFootprint, sampleReport } from './report-sample';

const chf = (value: number) => CHF_MONEY.format(rappen(value));
const spec = (kind: QuickKind, days = 3) =>
  receiptSpec(sampleReport(), kind, { money: CHF_MONEY, days });
const labels = (kind: QuickKind, days = 3) =>
  spec(kind, days).sections.flatMap((section) => section.map((post) => post.label));

describe('receiptSpec', () => {
  it('sums up the impact: saved and wasted (no «Weitergegeben»), then the total saved', () => {
    const receipt = spec('impact');
    expect(receipt.sections.map((section) => section.length)).toEqual([2, 2]);
    expect(receipt.sections[0]?.map((post) => post.label)).toEqual(['GERETTET', 'ENTSORGT']);
    expect(receipt.totals.at(-1)).toMatchObject({ label: 'TOTAL GERETTET', big: true });
    expect(receipt.empty).toBeUndefined();
  });

  describe('Klimabilanz on the Bilanz receipt', () => {
    const withFootprint = (footprint = sampleFootprint()) =>
      receiptSpec(sampleReport(), 'impact', { money: CHF_MONEY, days: 3, footprint });
    const posts = (receipt: ReturnType<typeof withFootprint>) =>
      receipt.sections.flat().map((post) => `${post.label} ${post.value}`);

    it('adds rescued food, CO2e, water, land and the Kehricht estimate', () => {
      const receipt = withFootprint();
      expect(posts(receipt)).toEqual(
        expect.arrayContaining([
          'KLIMABILANZ ',
          'LEBENSMITTEL 6,4 kg',
          'CO2E 21,8 kg CO2e',
          'WASSER 2’650 l',
          'FLÄCHE 24,3 m²',
          'KEHRICHT etwa CHF 2.08',
        ]),
      );
      expect(receipt.sections.flat().find((post) => post.label === 'KEHRICHT')?.note).toBe(
        'etwa 1,3 Säcke à 35 l',
      );
      expect(receipt.sections.flat()[4]?.note).toBe('35 % geschätzt');
      expect(receipt.source).toContain('CC BY 4.0');
    });

    it('is absent without a footprint, with nothing rescued, and has no Kehricht outside CHF', () => {
      const none = spec('impact');
      expect(posts(none).join()).not.toContain('KLIMABILANZ');
      expect(none.source).toBeUndefined();
      const zero = sampleFootprint();
      const empty = withFootprint({ ...zero, rescued: { ...zero.rescued, count: 0 } });
      expect(posts(empty).join()).not.toContain('KLIMABILANZ');
      expect(empty.source).toBeUndefined();
      expect(posts(withFootprint({ ...zero, kehricht: null })).join()).not.toContain('KEHRICHT');
    });
  });

  it('lists what expires within the chosen days, the overdue included', () => {
    // Today is 7.11.2026 in the sample: minced meat is overdue, chicken expires today.
    expect(labels('expiring', 1)).toEqual(['Hackfleisch', 'Poulet Brust', 'Joghurt Erdbeer']);
    expect(labels('expiring', 3)).toContain('Nüsslisalat');
    expect(labels('expiring', 7)).toContain('Vollmilch');
    expect(spec('expiring', 1).totals.at(-1)).toMatchObject({
      label: 'TOTAL IN GEFAHR',
      value: chf(890 + 1190 + 210),
    });
    expect(spec('expiring', 7).title).toBe('Läuft in den nächsten 7 Tagen ab');
  });

  it('lists what was thrown away, newest first, with date, reason and weight', () => {
    const receipt = spec('wasted');
    expect(labels('wasted')).toEqual([
      'Rucola',
      'Vollrahm',
      'Kopfsalat',
      'Ruchbrot',
      'Nüsslisalat',
    ]);
    expect(receipt.sections[0]?.[0]?.note).toBe('21.10.2026 · abgelaufen');
    expect(receipt.totals.map((post) => [post.label, post.value])).toEqual([
      ['ARTIKEL', '5'],
      ['GEWICHT', '1.0 kg'],
      ['TOTAL ENTSORGT', chf(350 + 420 + 350 + 245 + 350)],
    ]);
  });

  it('lists one place at a time', () => {
    expect(labels('fridge')).toHaveLength(7);
    expect(labels('freezer')).toEqual(['Glace Vanille', 'Erbsen']);
    expect(labels('pantry')).toEqual(['Spaghetti', 'Basmati-Reis']);
    expect(spec('freezer').title).toBe('Im Tiefkühler');
    expect(spec('pantry').totals.at(-1)).toMatchObject({
      label: 'TOTAL WERT',
      value: chf(180 + 390),
    });
    // An estimated price is marked like on the app's list.
    expect(spec('pantry').sections[0]?.[0]?.value).toBe(`${chf(180)} *`);
  });

  it('says so when a receipt has nothing to list', () => {
    const empty = buildReport({
      today: localDate('2026-11-07'),
      from: localDate('2026-11-01'),
      to: localDate('2026-11-07'),
      items: [],
      outcomes: [],
      purchases: [],
    });
    for (const kind of ['expiring', 'wasted', 'fridge', 'freezer', 'pantry'] as const) {
      const receipt = receiptSpec(empty, kind, { money: CHF_MONEY, days: 3 });
      expect(receipt.sections).toEqual([]);
      expect(receipt.empty).toBeTruthy();
      expect(receipt.totals.at(-1)?.value).toBe(chf(0));
    }
  });

  it('looks back over a period only where it matters', () => {
    const kinds: ReportKind[] = [
      'impact',
      'wasted',
      'full',
      'expiring',
      'fridge',
      'freezer',
      'pantry',
    ];
    expect(kinds.filter(usesPeriod)).toEqual(['impact', 'wasted', 'full']);
  });
});
