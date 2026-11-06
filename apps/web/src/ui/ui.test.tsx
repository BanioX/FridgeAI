import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GroupedList, GroupedListItem } from './GroupedList';
import { ItemRow } from './ItemRow';
import { StatusChip } from './StatusChip';
import { toneClasses, type Tone } from './tones';

describe('design-system primitives', () => {
  afterEach(cleanup);

  it('renders an item row with name, meta and a readable status label', () => {
    render(
      <ItemRow
        emoji="🥛"
        name="Vollmilch"
        meta="1 l · Kühlschrank"
        status={{ tone: 'today', label: 'heute' }}
      />,
    );
    expect(screen.getByText('Vollmilch')).toBeDefined();
    expect(screen.getByText('1 l · Kühlschrank')).toBeDefined();
    // Status is conveyed as text, not only as colour.
    expect(screen.getByText('heute').className).toContain('text-today');
  });

  it('gives every tone a chip style', () => {
    const tones: Tone[] = ['fresh', 'soon', 'today', 'danger', 'ice', 'wheat', 'olive', 'neutral'];
    for (const tone of tones) {
      render(<StatusChip tone={tone}>{tone}</StatusChip>);
      expect(toneClasses[tone].chip).not.toBe('');
      expect(screen.getByText(tone).className).toContain(toneClasses[tone].chip);
    }
  });

  it('keeps grouped rows a real list for screen readers', () => {
    render(
      <GroupedList>
        <GroupedListItem>Milch</GroupedListItem>
        <GroupedListItem inset="check">Brot</GroupedListItem>
      </GroupedList>,
    );
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Milch',
      'Brot',
    ]);
  });
});
