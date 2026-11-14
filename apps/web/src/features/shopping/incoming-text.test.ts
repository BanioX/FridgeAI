import { describe, expect, it } from 'vitest';
import { MAX_INCOMING, hasIncoming, incomingShoppingText } from './incoming-text';

const read = (query: string) => incomingShoppingText(new URLSearchParams(query));

describe('incomingShoppingText', () => {
  it('reads an own link', () => {
    expect(read('add=Milch%2C%202%20Joghurt')).toBe('Milch, 2 Joghurt');
  });

  it('reads shared text before its title and ignores a shared link', () => {
    expect(read('title=Einkauf&text=Brot%20und%20Eier&url=https%3A%2F%2Fexample.org')).toBe(
      'Brot und Eier',
    );
    expect(read('title=Einkauf&url=https%3A%2F%2Fexample.org')).toBe('Einkauf');
    expect(read('url=https%3A%2F%2Fexample.org')).toBeUndefined();
  });

  it('keeps lines, drops empty ones and tidies spaces', () => {
    expect(read('text=%20Milch%20%20%0A%0A%20Brot%0D%0AEier%20')).toBe('Milch\nBrot\nEier');
  });

  it('falls back when a value is blank and returns nothing without text', () => {
    expect(read('add=%20%20&text=Butter')).toBe('Butter');
    expect(read('')).toBeUndefined();
  });

  it('cuts long text to what the field accepts', () => {
    expect(read(`add=${'a'.repeat(MAX_INCOMING + 50)}`)).toHaveLength(MAX_INCOMING);
  });
});

describe('hasIncoming', () => {
  it('sees each name that carries text, nothing else', () => {
    for (const key of ['add', 'text', 'title', 'url']) {
      expect(hasIncoming(new URLSearchParams(`${key}=x`))).toBe(true);
    }
    expect(hasIncoming(new URLSearchParams('other=x'))).toBe(false);
  });
});
