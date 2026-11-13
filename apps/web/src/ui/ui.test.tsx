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
        categoryId="dairy-milk"
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

  it('shows an own line picture, never an emoji (ADR-0080)', () => {
    const { container } = render(
      <ItemRow
        categoryId="dairy-cheese-hard"
        name="Gruyère"
        meta="200 g"
        status={{ tone: 'neutral', label: 'in 9 Tagen' }}
      />,
    );
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('puts a long chip under the name, so the name is not cut off', () => {
    const row = (label: string) =>
      render(
        <ItemRow
          categoryId="fish-smoked-salmon"
          name="Rauchlachs"
          meta="1 Stk."
          status={{ tone: 'danger', label }}
        />,
      );
    const short = row('in 3 Tagen');
    expect(short.getByText('in 3 Tagen').parentElement?.className).toContain('items-center');
    short.unmount();
    const long = row('Nicht mehr verwenden');
    expect(long.getByText('Nicht mehr verwenden').parentElement?.className).toContain('flex-col');
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
