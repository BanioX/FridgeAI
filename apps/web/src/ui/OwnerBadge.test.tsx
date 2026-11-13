import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OwnerBadge } from './OwnerBadge';

describe('OwnerBadge', () => {
  afterEach(cleanup);

  it('names the owner for screen readers when given a label', () => {
    render(<OwnerBadge initials="Mi" label="Gehört Mia" />);
    expect(screen.getByRole('img', { name: 'Gehört Mia' }).textContent).toBe('Mi');
  });

  it('is decorative without a label (the name stands next to it)', () => {
    const { container } = render(<OwnerBadge initials="N" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('looks the same for everyone: the letters carry the meaning', () => {
    const { container, rerender } = render(<OwnerBadge initials="M" />);
    const first = container.firstElementChild?.className;
    rerender(<OwnerBadge initials="N" />);
    expect(container.firstElementChild?.className).toBe(first);
  });

  it('is about 22 px in a row and 32 px elsewhere', () => {
    const { container, rerender } = render(<OwnerBadge initials="M" size="sm" />);
    expect(container.firstElementChild?.className).toContain('size-[22px]');
    rerender(<OwnerBadge initials="M" />);
    expect(container.firstElementChild?.className).toContain('size-8');
  });
});
