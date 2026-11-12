import { describe, expect, it } from 'vitest';
import { messages } from '../../app/messages.de-CH';
import { shelfFor, shelfSuggestions } from './fridge-shelves';

describe('shelfFor', () => {
  it('puts food where «Wissen» says it keeps best', () => {
    expect(shelfFor('meat-minced')).toBe('bottom');
    expect(shelfFor('fish-fresh')).toBe('bottom');
    expect(shelfFor('produce-salad')).toBe('drawer');
    expect(shelfFor('dairy-butter')).toBe('door');
    expect(shelfFor('drinks-juice')).toBe('door');
    expect(shelfFor('prepared-leftovers')).toBe('top');
    expect(shelfFor('dairy-yoghurt')).toBe('middle');
    expect(shelfFor('dairy-eggs')).toBe('middle');
  });
});

describe('shelfSuggestions', () => {
  it('offers the suiting compartment first and leaves out names already used', () => {
    const offered = shelfSuggestions('meat-minced', messages.spots.shelves, ['türfach ']);
    expect(offered[0]).toEqual({ shelf: 'bottom', name: 'Unteres Fach', suits: true });
    expect(offered.map((entry) => entry.name)).toEqual([
      'Unteres Fach',
      'Oberes Fach',
      'Mittleres Fach',
      'Gemüsefach',
    ]);
    expect(offered.filter((entry) => entry.suits)).toHaveLength(1);
  });

  it('offers nothing once every compartment is a spot', () => {
    expect(
      shelfSuggestions('dairy-milk', messages.spots.shelves, Object.values(messages.spots.shelves)),
    ).toEqual([]);
  });
});
