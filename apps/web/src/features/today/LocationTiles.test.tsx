import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { LocationTiles } from './LocationTiles';
import { locationCounts } from './location-counts';

describe('locationCounts', () => {
  it('counts articles and urgent ones per location, Kühlschrank first', () => {
    const items = [
      { location: 'fridge' as const },
      { location: 'fridge' as const },
      { location: 'pantry' as const },
    ];
    expect(locationCounts(items, [{ location: 'fridge' as const }])).toEqual([
      { location: 'fridge', items: 2, urgent: 1 },
      { location: 'freezer', items: 0, urgent: 0 },
      { location: 'pantry', items: 1, urgent: 0 },
      { location: 'reserve', items: 0, urgent: 0 },
    ]);
  });
});

describe('LocationTiles', () => {
  it('links each location to its tab and reads as one sentence', () => {
    render(
      <MemoryRouter>
        <LocationTiles
          counts={[
            { location: 'fridge', items: 12, urgent: 2 },
            { location: 'freezer', items: 1, urgent: 0 },
            { location: 'pantry', items: 0, urgent: 0 },
            { location: 'reserve', items: 3, urgent: 0 },
          ]}
        />
      </MemoryRouter>,
    );
    const fridge = screen.getByRole('link', { name: 'Kühlschrank: 12 Artikel, 2 bald fällig' });
    expect(fridge.getAttribute('href')).toBe('/inventory?location=fridge');
    expect(screen.getByRole('link', { name: 'Tiefkühler: 1 Artikel' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Vorrat: 0 Artikel' }).getAttribute('href')).toBe(
      '/inventory?location=pantry',
    );
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });
});
