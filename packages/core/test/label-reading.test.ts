import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import type { Gtin } from '../src/model/primitives';
import { rankLabelHits, readLabel } from '../src/scan/label-reading';

const today = localDate('2026-11-12');

/** OCR of a milk carton: front, then the small print on the side. */
const MILK = `Naturaplan
Bio Vollmilch
pasteurisiert 3,9% Fett
1 l
Zutaten: Vollmilch
Nährwerte pro 100 ml
Energie 272 kJ
Fett 3.9 g
Mindestens haltbar bis 20.11.2026`;

describe('readLabel', () => {
  it('reads name words, amount, category and date from a pack', () => {
    const reading = readLabel(MILK, today);
    expect(reading.query).toBe('naturaplan bio vollmilch pasteurisiert fett');
    expect(reading.amount).toEqual({ quantity: 1000, unit: 'ml' });
    expect(reading.categoryId).toBe('dairy-milk');
    expect(reading.expiry).toEqual({ date: '2026-11-20', kind: 'best_before' });
  });

  it('skips the serving size and takes the pack size', () => {
    const reading = readLabel('Griechisches Joghurt nature\npro 100 g\n500 g', today);
    expect(reading.amount).toEqual({ quantity: 500, unit: 'g' });
    expect(reading.categoryId).toBe('dairy-yoghurt');
  });

  it('counts pieces when the pack says so', () => {
    expect(readLabel('Freiland Eier\n6 Stück\nKlasse A', today).amount).toEqual({
      quantity: 6,
      unit: 'pcs',
    });
  });

  it('keeps ingredients out of the name and the category', () => {
    const reading = readLabel(
      'Milchschokolade\nmit Haselnüssen\n100 g\nZutaten: Zucker, Vollmilchpulver, Kakaobutter',
      today,
    );
    expect(reading.query).toBe('milchschokolade haselnuessen');
    expect(reading.query).not.toContain('vollmilchpulver');
    expect(reading.categoryId).toBe('pantry-sweets');
  });

  it('reads the dotless i that OCR puts into «Bio»', () => {
    expect(readLabel('Naturaplan\nBıo Vollmilch', today).query).toBe('naturaplan bio vollmilch');
  });

  it('says nothing it cannot read', () => {
    expect(readLabel('', today)).toEqual({ query: '' });
    expect(readLabel('~~ 12 ::', today)).toEqual({ query: '' });
  });
});

const hit = (name: string, brand?: string) => ({
  gtin: '7610000000000' as Gtin,
  name,
  ...(brand === undefined ? {} : { brand }),
});

describe('rankLabelHits', () => {
  const query = readLabel(MILK, today).query;

  it('keeps products whose own words are on the label, best first', () => {
    const ranked = rankLabelHits(query, [
      hit('Vollmilch UHT', 'Valflora'),
      hit('Bio Vollmilch', 'Naturaplan'),
      hit('Vollmilch pasteurisiert'),
    ]);
    expect(ranked.map((entry) => entry.name)).toEqual(['Bio Vollmilch', 'Vollmilch pasteurisiert']);
  });

  it('needs a word that names the product, not only the brand and «Bio»', () => {
    expect(rankLabelHits(query, [hit('Bio Akazienhonig', 'Naturaplan')])).toEqual([]);
  });

  it('needs two shared words: one common word is not enough', () => {
    expect(rankLabelHits(query, [hit('Vollmilch')])).toEqual([]);
    expect(rankLabelHits('', [hit('Bio Vollmilch', 'Naturaplan')])).toEqual([]);
  });

  it('returns at most the limit', () => {
    const many = Array.from({ length: 5 }, () => hit('Bio Vollmilch', 'Naturaplan'));
    expect(rankLabelHits(query, many, 2)).toHaveLength(2);
  });
});
