import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  categoryById,
  localDate,
  matchCategoryByName,
  needsWatching,
  perishability,
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
