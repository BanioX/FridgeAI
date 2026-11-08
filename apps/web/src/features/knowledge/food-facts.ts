import { messages } from '../../app/messages.de-CH';

const FACTS = messages.knowledge.facts;

/** The same seed always gives the same fact: a rescue keeps its fact, a day keeps its own. */
export function factFor(seed: string): string {
  let hash = 0;
  for (const char of seed) {
    hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  }
  return FACTS[hash % FACTS.length] ?? FACTS[0];
}
