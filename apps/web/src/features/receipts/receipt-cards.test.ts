import { parseReceiptText, toLocalDate, type Id } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import {
  buildCards,
  chosenExpiry,
  expiryOf,
  locationOf,
  summarize,
  withDecision,
  withExpiry,
  withLocation,
} from './receipt-cards';
import { isFood, type Review } from './ReceiptReview';

// An invented Coop receipt: bread, chicken, shampoo (not food), pet food (not food).
const TEXT = [
  'Musterstadt Zentrum',
  '05.11.26 18:47 00123 00456789 001 0001234',
  'Artikel Menge Preis Aktion Total Zusatz',
  'Semmeli 80G 2.0 0.70 1.40 0 A',
  'Coop Pouletbrust 2St. ca. 330g 0.307 10.40 8.30 8.30 0 A',
  'Shampoo Classic 1.0 2.95 2.95 1 A',
  'Dreamies mit Lachs 1.0 2.50 2.50 0 A',
  'Total CHF 15.55',
].join('\n');

function review(): Review {
  const receipt = parseReceiptText(TEXT);
  return {
    receipt,
    hash: 'a'.repeat(64),
    source: 'pdf',
    commandId: 'cmd' as Id,
    chosen: new Set(receipt.lines.flatMap((line, index) => (isFood(line) ? [index] : []))),
    memory: new Map(),
  };
}

const today = toLocalDate('2026-11-13');
const indexOf = (r: Review, name: string) =>
  r.receipt.lines.findIndex((line) => line.name.includes(name));

describe('buildCards', () => {
  it('has one card per food line of an included receipt, in printed order', () => {
    const first = review();
    const second = review();
    const cards = buildCards([
      { key: 'a', review: first, excluded: false },
      { key: 'b', review: second, excluded: true },
      { key: 'c', review: second, excluded: false },
    ]);
    expect(cards.map((card) => card.sectionKey)).toEqual(['a', 'a', 'c', 'c']);
    expect(cards.map((card) => first.receipt.lines[card.index]?.name)).toEqual([
      first.receipt.lines[indexOf(first, 'Semmeli')]?.name,
      first.receipt.lines[indexOf(first, 'Pouletbrust')]?.name,
      first.receipt.lines[indexOf(first, 'Semmeli')]?.name,
      first.receipt.lines[indexOf(first, 'Pouletbrust')]?.name,
    ]);
  });
});

describe('place and date', () => {
  it('starts with the category default and the estimate the import would store', () => {
    const r = review();
    const poulet = indexOf(r, 'Pouletbrust');
    expect(locationOf(r, poulet)).toBe('fridge');
    expect(chosenExpiry(r, poulet)).toBeUndefined();
    expect(expiryOf(r, poulet, today) > today).toBe(true);
  });

  it('keeps a chosen place and drops a date picked for the old one', () => {
    const r = review();
    const poulet = indexOf(r, 'Pouletbrust');
    const dated = withExpiry(r, poulet, toLocalDate('2026-11-20'));
    expect(expiryOf(dated, poulet, today)).toBe('2026-11-20');
    const moved = withLocation(dated, poulet, 'freezer');
    expect(locationOf(moved, poulet)).toBe('freezer');
    expect(chosenExpiry(moved, poulet)).toBeUndefined();
    expect(expiryOf(moved, poulet, today) > expiryOf(r, poulet, today)).toBe(true);
    // The original is untouched.
    expect(locationOf(r, poulet)).toBe('fridge');
  });

  it('keeps the place when a date is set or cleared', () => {
    const r = review();
    const poulet = indexOf(r, 'Pouletbrust');
    const there = withLocation(r, poulet, 'freezer');
    const dated = withExpiry(there, poulet, toLocalDate('2027-01-01'));
    expect(locationOf(dated, poulet)).toBe('freezer');
    const cleared = withExpiry(dated, poulet, null);
    expect(locationOf(cleared, poulet)).toBe('freezer');
    expect(chosenExpiry(cleared, poulet)).toBeUndefined();
  });
});

describe('decisions and summary', () => {
  it('ticks and unticks the line like the list does, and counts both', () => {
    const r = review();
    const sections = [{ key: 'a', review: r, excluded: false }];
    const cards = buildCards(sections);
    const bread = indexOf(r, 'Semmeli');
    const left = withDecision(r, bread, false);
    expect(left.chosen.has(bread)).toBe(false);
    expect(r.chosen.has(bread)).toBe(true);
    expect(summarize([{ key: 'a', review: left, excluded: false }], cards)).toEqual({
      taken: 1,
      left: 1,
    });
    expect(withDecision(left, bread, true).chosen.has(bread)).toBe(true);
  });
});
