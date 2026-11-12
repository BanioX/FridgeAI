import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OwnerBadge, ownerTone } from './OwnerBadge';

describe('OwnerBadge', () => {
  afterEach(cleanup);

  it('names the owner for screen readers when given a label', () => {
    render(<OwnerBadge initials="Mi" index={1} label="Gehört Mia" />);
    expect(screen.getByRole('img', { name: 'Gehört Mia' }).textContent).toBe('Mi');
  });

  it('is decorative without a label (the name stands next to it)', () => {
    const { container } = render(<OwnerBadge initials="N" index={0} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('picks a tone by order and wraps around after the palette', () => {
    const tones = [0, 1, 2, 3, 4].map(ownerTone);
    expect(new Set(tones).size).toBe(5);
    expect(ownerTone(5)).toBe(ownerTone(0));
    expect(ownerTone(-1)).toBe(ownerTone(4));
  });

  it('is about 22 px in a row and 32 px elsewhere', () => {
    const { container, rerender } = render(<OwnerBadge initials="M" index={0} size="sm" />);
    expect(container.firstElementChild?.className).toContain('size-[22px]');
    rerender(<OwnerBadge initials="M" index={0} />);
    expect(container.firstElementChild?.className).toContain('size-8');
  });
});
