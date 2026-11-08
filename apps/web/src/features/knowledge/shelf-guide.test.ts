import { describe, expect, it } from 'vitest';
import { describeDays, shelfGuide } from './shelf-guide';

const names = (query: string) =>
  shelfGuide(query).flatMap((group) => group.entries.map((entry) => entry.name));

describe('Haltbarkeit A–Z (ADR-0041)', () => {
  it('lists food only, dairy first, each group sorted by name', () => {
    const groups = shelfGuide();
    expect(groups[0]?.group).toBe('dairy');
    expect(groups.map((group) => group.group)).not.toContain('non_food');
    const dairy = groups[0]?.entries.map((entry) => entry.name) ?? [];
    expect(dairy).toEqual([...dairy].sort((a, b) => a.localeCompare(b, 'de-CH')));
  });

  it('finds a food by its name or a keyword, without caring for umlauts or case', () => {
    expect(names('pesto')).toEqual(['Tomatenmark & Pesto']);
    expect(names('MOZZARELLA')).toEqual(['Quark & Frischkäse']);
    expect(names('kase')).toContain('Hartkäse');
    expect(names('gibt es nicht')).toEqual([]);
  });

  it('says how long it keeps, open and frozen', () => {
    const yoghurt = shelfGuide('joghurt')[0]?.entries[0];
    expect(yoghurt).toMatchObject({
      name: 'Joghurt',
      score: 4,
      level: 'high',
      keeps: { days: 14, at: 'fridge' },
      openedDays: 3,
      freezerDays: 60,
    });
    // Ice cream keeps in the freezer anyway: no «einfrieren» line for it.
    expect(shelfGuide('glace')[0]?.entries[0]).toMatchObject({
      keeps: { at: 'freezer' },
      freezerDays: null,
    });
  });

  it('describes days in words', () => {
    expect([1, 3, 14, 30, 90, 365, 730].map(describeDays)).toEqual([
      'etwa 1 Tag',
      'etwa 3 Tage',
      'etwa 2 Wochen',
      'etwa 4 Wochen',
      'etwa 3 Monate',
      'etwa 12 Monate',
      'etwa 2 Jahre',
    ]);
  });
});
