import { describe, expect, it } from 'vitest';
import { messages } from '../../app/messages.de-CH';
import { factFor } from './food-facts';

describe('food facts (ADR-0042)', () => {
  it('gives the same fact for the same seed and spreads over all facts', () => {
    expect(factFor('2026-11-08')).toBe(factFor('2026-11-08'));
    const seen = new Set(
      Array.from({ length: 400 }, (_, index) => factFor(`seed-${String(index)}`)),
    );
    expect(seen.size).toBe(messages.knowledge.facts.length);
  });

  it('names its source whenever a fact has a number', () => {
    for (const fact of messages.knowledge.facts) {
      if (/\d/.test(fact)) {
        expect(fact, fact).toMatch(/\((BAFU|BLV)\)\.$/);
      }
    }
  });
});
