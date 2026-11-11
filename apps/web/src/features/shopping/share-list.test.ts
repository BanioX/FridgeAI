import { describe, expect, it } from 'vitest';
import { shoppingListText } from './share-list';

describe('shoppingListText (K13)', () => {
  it('writes the title and one open entry per line, with quantity where there is one', () => {
    const text = shoppingListText('Nachkaufen', [
      { name: 'Milch', checked: false },
      { name: 'Joghurt', checked: false, quantity: 2, unit: 'pcs' },
      { name: 'Hackfleisch', checked: false, quantity: 500, unit: 'g' },
      { name: 'Brot', checked: true },
    ]);
    expect(text).toBe('Nachkaufen\nMilch\n2 Stk. Joghurt\n500 g Hackfleisch');
  });

  it('is empty when nothing is open', () => {
    expect(shoppingListText('Nachkaufen', [])).toBe('');
    expect(shoppingListText('Nachkaufen', [{ name: 'Brot', checked: true }])).toBe('');
  });
});
