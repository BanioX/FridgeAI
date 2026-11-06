import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { AI_IMPORT_MAX_ITEMS, aiImportPrompt, parseAiImport } from '../src/import/ai-import';

const today = localDate('2026-11-06');

describe('aiImportPrompt', () => {
  it('asks for the JSON format and names today', () => {
    const prompt = aiImportPrompt(today);
    expect(prompt).toContain('{"fridgeai":1,"items":[');
    expect(prompt).toContain('Heute ist der 2026-11-06.');
    expect(prompt).not.toMatch(/\b(ihr|euch|euer)\b/i);
  });
});

describe('parseAiImport: JSON', () => {
  it('reads the requested format inside a ```json fence with chatter around it', () => {
    const answer = [
      'Hier ist deine Liste:',
      '```json',
      '{"fridgeai":1,"items":[',
      ' {"name":"Vollmilch","quantity":1,"unit":"l","location":"fridge","expiresOn":"2026-11-20"},',
      ' {"name":"Grana Padano","quantity":300,"unit":"g"},',
      ' {"name":"Eier","quantity":10,"unit":"pcs","container":"box"}',
      ']}',
      '```',
      'Guten Appetit!',
    ].join('\n');
    const result = parseAiImport(answer, today);
    expect(result.unreadable).toBe(false);
    expect(result.skipped).toEqual([]);
    expect(result.items).toEqual([
      {
        name: 'Vollmilch',
        quantity: 1000,
        unit: 'ml',
        location: 'fridge',
        expiresOn: '2026-11-20',
      },
      { name: 'Grana Padano', quantity: 300, unit: 'g' },
      { name: 'Eier', quantity: 10, unit: 'pcs', container: 'box' },
    ]);
  });

  it('accepts a bare array, German words and Swiss dates', () => {
    const result = parseAiImport(
      '[{"name":"Rahm","quantity":2.5,"unit":"dl","location":"Kühlschrank","expiresOn":"12.11.2026"},' +
        '{"name":"Joghurt","quantity":2,"unit":"Becher"}]',
      today,
    );
    expect(result.items).toEqual([
      { name: 'Rahm', quantity: 250, unit: 'ml', location: 'fridge', expiresOn: '2026-11-12' },
      { name: 'Joghurt', quantity: 2, unit: 'pcs', container: 'cup' },
    ]);
  });

  it('skips broken entries but keeps the good ones', () => {
    const result = parseAiImport(
      '{"items":[{"name":""},{"name":"Brot","quantity":-1},{"name":"Bananen","quantity":6},{"foo":1}]}',
      today,
    );
    expect(result.items).toEqual([{ name: 'Bananen', quantity: 6, unit: 'pcs' }]);
    expect(result.skipped).toHaveLength(3);
  });

  it('ignores an unreadable date and an unknown location instead of failing', () => {
    const result = parseAiImport(
      '{"items":[{"name":"Tofu","expiresOn":"bald","location":"Balkon"}]}',
      today,
    );
    expect(result.items).toEqual([{ name: 'Tofu', quantity: 1, unit: 'pcs' }]);
  });
});

describe('parseAiImport: lines', () => {
  it('reads «Name; Menge; Lagerort; Datum» with bullets and ignores chatter', () => {
    const answer = [
      'Klar, das sehe ich auf dem Foto:',
      '- Vollmilch; 1 l; Kühlschrank; 20.11.2026',
      '* Erbsen | 750 g | Tiefkühler',
      '3. Bananen; 6 Stk',
      '- Basmatireis; 1,5 kg; Vorrat',
    ].join('\n');
    const result = parseAiImport(answer, today);
    expect(result.items).toEqual([
      {
        name: 'Vollmilch',
        quantity: 1000,
        unit: 'ml',
        location: 'fridge',
        expiresOn: '2026-11-20',
      },
      { name: 'Erbsen', quantity: 750, unit: 'g', location: 'freezer' },
      { name: 'Bananen', quantity: 6, unit: 'pcs' },
      { name: 'Basmatireis', quantity: 1500, unit: 'g', location: 'pantry' },
    ]);
    expect(result.skipped).toEqual([]);
  });

  it('reports lines it cannot read', () => {
    const result = parseAiImport('Käse; viel; Kühlschrank', today);
    expect(result.items).toEqual([]);
    expect(result.skipped).toEqual([{ entry: 'Käse; viel; Kühlschrank', reason: 'invalid' }]);
    expect(result.unreadable).toBe(true);
  });

  it('marks plain prose as unreadable', () => {
    expect(parseAiImport('Ich kann auf dem Bild leider nichts erkennen.', today)).toEqual({
      items: [],
      skipped: [],
      unreadable: true,
    });
  });
});

describe('parseAiImport: limits', () => {
  it('strips control characters and caps names at 120 characters', () => {
    const result = parseAiImport(
      JSON.stringify({ items: [{ name: `Milch\u0007\u0000 ${'x'.repeat(200)}` }] }),
      today,
    );
    const name = result.items[0]?.name ?? '';
    expect(name.startsWith('Milch x')).toBe(true);
    expect(name).toHaveLength(120);
  });

  it(`takes at most ${String(AI_IMPORT_MAX_ITEMS)} items`, () => {
    const items = Array.from({ length: AI_IMPORT_MAX_ITEMS + 3 }, (_, i) => ({
      name: `Artikel ${String(i)}`,
    }));
    const result = parseAiImport(JSON.stringify({ items }), today);
    expect(result.items).toHaveLength(AI_IMPORT_MAX_ITEMS);
    expect(result.skipped.filter((s) => s.reason === 'too_many')).toHaveLength(3);
  });
});
