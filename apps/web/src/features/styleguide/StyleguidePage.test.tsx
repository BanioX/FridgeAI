import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StyleguidePage } from './StyleguidePage';

describe('StyleguidePage', () => {
  afterEach(cleanup);

  it('renders every design-system primitive', () => {
    render(<StyleguidePage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Heute retten');
    expect(screen.getByText('CHF 42.80')).toBeDefined();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByRole('button', { name: 'Quittung scannen' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Manuell erfassen' }).getAttribute('type')).toBe(
      'button',
    );
    expect(screen.getByText('Tiefkühler')).toBeDefined();
  });
});
