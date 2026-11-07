import type { InventoryItemView } from '@fridgeai/core';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductFacts } from './ProductFacts';

vi.mock('../../app/AppData', () => ({
  useAppData: () => ({ householdId: 'h', ids: { next: () => 'c' }, inventory: {} }),
}));

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

  it('offers the photo import when nutrition is missing, and no attribution for other sources', () => {
    render(<ProductFacts item={{ ...base, nutriScore: 'e', productSource: 'manual' }} />);
    expect(screen.getByText('Nutri-Score E')).toBeDefined();
    expect(screen.getByText(/Nährwerte fehlen\. Fotografiere die Nährwerttabelle/)).toBeDefined();
    expect(screen.getByLabelText('Foto oder Screenshot wählen')).toBeDefined();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('keeps the ODbL attribution for Open Food Facts and notes values read from a photo', () => {
    const { container } = render(<ProductFacts item={{ ...base, productSource: 'off' }} />);
    expect(screen.getByRole('link', { name: 'Daten: Open Food Facts (ODbL)' })).toBeDefined();
    container.remove();
    cleanup();
    render(
      <ProductFacts
        item={{
          ...base,
          productSource: 'off',
          nutrition: { basis: '100g', energyKcal: 250, fat: 8.5, source: 'manual' },
        }}
      />,
    );
    expect(
      screen.getByText('Aus deinem Bild gelesen, ohne Gewähr. Massgebend ist die Packung.'),
    ).toBeDefined();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByLabelText('Foto oder Screenshot wählen')).toBeNull();
    expect(screen.getByText('250 kcal')).toBeDefined();
  });
});
