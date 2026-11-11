import { describe, expect, it } from 'vitest';
import { matchCategoryByName, shoppingTips } from '../src';

const dips = matchCategoryByName('Hummus')?.id ?? '';
const habits = [{ categoryId: dips, tip: 'Lieber die kleine Packung kaufen.' }];

describe('shoppingTips (K5)', () => {
  it('knows the dip category the tests rely on', () => {
    expect(dips).not.toBe('');
  });

  it('gives a tip for an entry named like a habit category, with the category tip', () => {
    const tips = shoppingTips({
      entries: [{ id: 'a', name: 'Hummus', checked: false }],
      habits,
    });
    expect(tips.get('a')).toEqual({ categoryId: dips, tip: 'Lieber die kleine Packung kaufen.' });
  });

  it('prefers the category stored on the entry over the name', () => {
    const tips = shoppingTips({
      entries: [{ id: 'a', name: 'Etwas Anderes', checked: false, categoryId: dips }],
      habits,
    });
    expect(tips.has('a')).toBe(true);
  });

  it('leaves out other categories, checked entries and unknown names', () => {
    const tips = shoppingTips({
      entries: [
        { id: 'milk', name: 'Milch', checked: false },
        { id: 'done', name: 'Hummus', checked: true },
        { id: 'odd', name: 'qwertz', checked: false },
      ],
      habits,
    });
    expect(tips.size).toBe(0);
  });

  it('omits the tip when the habit has none, and gives nothing without habits', () => {
    const entries = [{ id: 'a', name: 'Hummus', checked: false }];
    expect(shoppingTips({ entries, habits: [{ categoryId: dips }] }).get('a')).toEqual({
      categoryId: dips,
    });
    expect(shoppingTips({ entries, habits: [] }).size).toBe(0);
  });
});
