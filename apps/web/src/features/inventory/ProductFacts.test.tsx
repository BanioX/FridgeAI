import type { InventoryItemView } from '@fridgeai/core';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProductFacts } from './ProductFacts';

const base = { id: 'x', name: 'Vollmilch' } as InventoryItemView;

describe('ProductFacts', () => {
  afterEach(cleanup);

  it('shows nutrition per 100 ml, the Nutri-Score, known allergens and the source', () => {
    render(
      <ProductFacts
        item={{
          ...base,
          nutrition: { basis: '100ml', energyKcal: 64, fat: 3.5, sugars: 4.8, source: 'off' },
          nutriScore: 'b',
          allergens: ['milk', 'gluten', 'unknown-tag'],
          productSource: 'off',
        }}
      />,
    );
    expect(screen.getByText('Nutri-Score B')).toBeDefined();
    const table = screen.getByRole('table', { name: 'pro 100 ml' });
    expect(within(table).getByRole('rowheader', { name: 'Energie' })).toBeDefined();
    expect(within(table).getByText('64 kcal')).toBeDefined();
    expect(within(table).getByText('3.5 g')).toBeDefined();
    expect(within(table).getByRole('rowheader', { name: 'davon Zucker' })).toBeDefined();
    expect(screen.getByText('Milch, Gluten')).toBeDefined();
    expect(
      screen.getByRole('link', { name: 'Daten: Open Food Facts (ODbL)' }).getAttribute('rel'),
    ).toBe('noopener noreferrer');
  });

  it('shows nothing without facts and no attribution for other sources', () => {
    const { container } = render(<ProductFacts item={base} />);
    expect(container.innerHTML).toBe('');
    render(<ProductFacts item={{ ...base, nutriScore: 'e', productSource: 'manual' }} />);
    expect(screen.getByText('Nutri-Score E')).toBeDefined();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
