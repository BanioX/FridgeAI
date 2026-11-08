import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  categoryById,
  localDate,
  matchCategoryByName,
  needsWatching,
  perishability,
  scoreForDays,
  shelfScore,
  type Category,
} from '../src';

const category = (id: string): Category => {
  const found = categoryById(id);
  if (found === undefined) {
    throw new Error(id);
  }
  return found;
};
const level = (id: string) => perishability(category(id));
const today = localDate('2026-11-08');

describe('perishability (ADR-0038)', () => {
  it('calls fresh meat, dairy, dips and salad delicate', () => {
    for (const id of [
      'meat-fresh',
      'meat-minced',
      'fish-fresh',
      'dairy-milk',
      'dairy-yoghurt',
      'dairy-cheese-soft',
      'prepared-dips',
      'prepared-ready-meals',
      'produce-salad',
    ]) {
      expect(level(id), id).toBe('high');
    }
  });

  it('calls butter, hard cheese and eggs medium', () => {
    for (const id of ['dairy-butter', 'dairy-cheese-hard', 'dairy-eggs', 'produce-apples']) {
      expect(level(id), id).toBe('medium');
    }
  });

  it('calls drinks, ice cream, frozen food and closed sauces robust', () => {
    for (const id of [
      'drinks-soft',
      'drinks-juice',
      'drinks-alcohol',
      'frozen-icecream',
      'frozen-vegetables',
      'pantry-pasta',
      'pantry-sauces',
      'pantry-tomato-paste',
    ]) {
      expect(level(id), id).toBe('low');
    }
  });

  it('keeps milk out of the drinks', () => {
    expect(category('dairy-milk').group).toBe('dairy');
    expect(matchCategoryByName('Vollmilch')?.id).toBe('dairy-milk');
  });

  it('knows the typical «bought once, used once» products', () => {
    expect(matchCategoryByName('Hummus Natur')?.id).toBe('prepared-dips');
    expect(matchCategoryByName('Guacamole')?.id).toBe('prepared-dips');
    expect(matchCategoryByName('Thomy Mayonnaise')?.id).toBe('pantry-sauces');
    expect(matchCategoryByName('French Salatsauce')?.id).toBe('pantry-sauces');
    expect(matchCategoryByName('Tomatenmark Tube')?.id).toBe('pantry-tomato-paste');
    expect(matchCategoryByName('Pesto alla Genovese')?.id).toBe('pantry-tomato-paste');
    // Once open they are short-lived, which is why they end up in the bin.
    expect(category('prepared-dips').afterOpeningDays).toBe(3);
    expect(category('pantry-tomato-paste').afterOpeningDays).toBe(5);
  });

  it('gives every food category a level', () => {
    const levels = new Set(CATEGORIES.map((entry) => perishability(entry)));
    expect([...levels].sort()).toEqual(['high', 'low', 'medium']);
  });
});

describe('shelf score 1 to 10 (Haltbarkeit, 10 = hält am längsten)', () => {
  const score = (id: string, opened = false) => shelfScore(category(id), { opened });

  it('follows the days in roughly doubling steps', () => {
    expect([1, 2, 3, 4, 7, 14, 30, 60, 180, 365, 1095, 1096, 9125].map(scoreForDays)).toEqual([
      1, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10,
    ]);
  });

  it('scores the catalog as in the table for Alban', () => {
    const scores = Object.fromEntries(
      [
        'meat-minced',
        'prepared-ready-meals',
        'dairy-milk',
        'dairy-yoghurt',
        'prepared-dips',
        'dairy-cheese-hard',
        'dairy-butter',
        'drinks-juice',
        'drinks-soft',
        'pantry-sauces',
        'pantry-pasta',
        'reserve-freeze-dried',
      ].map((id) => [id, score(id)]),
    );
    expect(scores).toEqual({
      'meat-minced': 1,
      'prepared-ready-meals': 2,
      'dairy-milk': 3,
      'dairy-yoghurt': 4,
      'prepared-dips': 4,
      'dairy-cheese-hard': 5,
      'dairy-butter': 6,
      'drinks-juice': 7,
      'drinks-soft': 8,
      'pantry-sauces': 8,
      'pantry-pasta': 9,
      'reserve-freeze-dried': 10,
    });
  });

  it('drops for an open pack and stays low with a Verbrauchsdatum', () => {
    expect(score('prepared-dips', true)).toBe(2);
    expect(score('pantry-tomato-paste', true)).toBe(3);
    expect(score('pantry-sauces', true)).toBe(5);
    // Smoked salmon keeps ten days, but its Verbrauchsdatum caps the score.
    expect(score('fish-smoked-salmon')).toBe(3);
  });

  it('maps every score to the three levels', () => {
    for (const entry of CATEGORIES) {
      const value = shelfScore(entry);
      const expected = value <= 4 ? 'high' : value <= 6 ? 'medium' : 'low';
      expect(perishability(entry), entry.id).toBe(expected);
    }
  });
});

describe('needsWatching', () => {
  const item = (categoryId: string, expiresOn: string, openedOn?: string) => ({
    categoryId,
    expiresOn: localDate(expiresOn),
    ...(openedOn === undefined ? {} : { openedOn: localDate(openedOn) }),
  });

  it('leaves robust food alone while its date is far', () => {
    expect(needsWatching(item('drinks-soft', '2027-06-01'), today)).toBe(false);
    expect(needsWatching(item('frozen-icecream', '2027-03-01'), today)).toBe(false);
  });

  it('watches delicate food, open packs and dates within a week', () => {
    expect(needsWatching(item('dairy-yoghurt', '2026-11-20'), today)).toBe(true);
    expect(needsWatching(item('pantry-sauces', '2027-06-01', '2026-11-01'), today)).toBe(true);
    expect(needsWatching(item('drinks-juice', '2026-11-14'), today)).toBe(true);
    expect(needsWatching(item('unknown-category', '2027-06-01'), today)).toBe(true);
  });
});
