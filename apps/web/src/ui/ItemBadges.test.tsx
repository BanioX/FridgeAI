import { cleanup, render, screen } from '@testing-library/react';
import { localDate, type ItemBadge } from '@fridgeai/core';
import { afterEach, describe, expect, it } from 'vitest';
import { ItemBadges } from './ItemBadges';

const all: ItemBadge[] = [
  { kind: 'made' },
  { kind: 'leftover' },
  { kind: 'frozen', on: localDate('2026-11-03') },
  { kind: 'thawed', on: localDate('2026-11-10') },
  { kind: 'ready' },
  { kind: 'opened', on: localDate('2026-11-09') },
  { kind: 'loose' },
];

describe('ItemBadges', () => {
  afterEach(cleanup);

  it('shows every badge as text, the frozen one with its short day', () => {
    render(<ItemBadges badges={all} />);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Selbst gemacht',
      'Reste',
      'Eingefroren 3.11.',
      'Aufgetaut',
      'Fertigprodukt',
      'Geöffnet',
      'Von der Theke',
    ]);
  });

  it('keeps rows calm with a maximum', () => {
    render(<ItemBadges badges={all} max={2} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders nothing without badges', () => {
    const { container } = render(<ItemBadges badges={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('gives the tones their classes: ice filled, ice outline, apricot outline, olive', () => {
    render(<ItemBadges badges={all} />);
    const [made, leftover, frozen, thawed, ready, opened, loose] = screen.getAllByRole('listitem');
    expect(made?.className).toContain('bg-surface-muted');
    expect(leftover?.className).toContain('bg-surface-muted');
    expect(frozen?.className).toContain('bg-ice-bg');
    expect(thawed?.className).toContain('border-ice');
    expect(ready?.className).toContain('bg-surface-muted');
    expect(opened?.className).toContain('border-apricot');
    expect(loose?.className).toContain('bg-olive-bg');
  });
});
