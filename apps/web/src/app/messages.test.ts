import { describe, expect, it } from 'vitest';
import { messages } from './messages.de-CH';

/** Every text in the catalog, including the literal parts of message functions. */
function texts(value: unknown, path: string): [path: string, text: string][] {
  if (typeof value === 'string' || typeof value === 'function') {
    return [[path, String(value)]];
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, child]) => texts(child, `${path}.${key}`));
  }
  return [];
}

describe('messages.de-CH', () => {
  it('talks to one person with «du», never «ihr», «euch» or «euer»', () => {
    for (const [path, text] of texts(messages, 'messages')) {
      expect(text, path).not.toMatch(/\b(ihr|euch|euer|eure[mnrs]?)\b/i);
    }
  });

  it('says «Quittung», never «Bon» or «Kassenbon» (Alban, 7.11.2026; docs/glossar.md)', () => {
    for (const [path, text] of texts(messages, 'messages')) {
      expect(text, path).not.toMatch(/\b(Kassen)?[Bb]ons?\b/);
    }
  });

  it('uses «ss» instead of «ß»', () => {
    for (const [path, text] of texts(messages, 'messages')) {
      expect(text, path).not.toContain('ß');
    }
  });
});
