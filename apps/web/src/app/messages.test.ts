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

  it('writes the brand «Rettich» with a capital R (Alban, 8.11.2026; ADR-0032)', () => {
    for (const [path, text] of texts(messages, 'messages')) {
      expect(text, path).not.toMatch(/(?<![\w/@.-])rettich(?![\w]|\.app|-bericht)/);
    }
  });

  it('says «Abfall», never «Kübel» (Alban, 8.11.2026)', () => {
    for (const [path, text] of texts(messages, 'messages')) {
      expect(text, path).not.toMatch(/Kübel/);
    }
  });

  it('says «verwertet» and «entsorgt», never «gegessen» or «weggeworfen» (ADR-0046)', () => {
    for (const [path, text] of texts(messages, 'messages')) {
      expect(text, path).not.toMatch(/gegessen|weggeworfen|wegwerf|\b(essen|isst)\b/i);
    }
  });

  it('speaks calmly: no buzzwords, no English «Food Waste», no exclamation marks (ADR-0047)', () => {
    for (const [path, text] of texts(messages, 'messages')) {
      expect(text, path).not.toMatch(/\b(smart|insights?|hub|magic|journey|food waste)\b/i);
      expect(text, path).not.toMatch(/![^=]/);
    }
  });

  it('uses «ss» instead of «ß»', () => {
    for (const [path, text] of texts(messages, 'messages')) {
      expect(text, path).not.toContain('ß');
    }
  });
});
