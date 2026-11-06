import 'fake-indexeddb/auto';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { TodayPage } from './TodayPage';

function renderPage(db = testDb()) {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>
        <TodayPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

describe('TodayPage', () => {
  afterEach(cleanup);

  it('shows the welcome card for an empty household', async () => {
    renderPage();
    expect(await screen.findByText(messages.today.welcomeTitle)).toBeDefined();
    const link = screen.getByRole('link', { name: messages.today.firstItem });
    expect(link.getAttribute('href')).toBe('/inventory/new');
    expect(screen.getByText(messages.today.expiringEmpty)).toBeDefined();
    expect(screen.getAllByText(messages.today.itemCount(0))).toHaveLength(4);
  });

  it('shows value, expiring items with chips and location counts', async () => {
    const db = testDb();
    await seedDb(db, [
      { name: 'Hackfleisch', location: 'fridge', inDays: 1, expiryKind: 'use_by' },
      { name: 'Vollmilch', location: 'fridge', inDays: 20, priceRappen: 195 },
      { name: 'Reis', location: 'pantry', inDays: 200 },
      { name: 'Wasser', location: 'reserve', inDays: 400 },
    ]);
    renderPage(db);

    expect(await screen.findByText('Hackfleisch')).toBeDefined();
    const list = screen.getByRole('region', { name: messages.today.expiringTitle });
    expect(within(list).getByText('morgen')).toBeDefined();
    expect(within(list).queryByText('Vollmilch')).toBeNull();
    expect(screen.getByText(/Stk\. · Kühlschrank/)).toBeDefined();

    // Hackfleisch is only estimated, Vollmilch has a price: total is a CHF figure with the hint.
    expect(screen.getByText(/^CHF\s/)).toBeDefined();
    expect(screen.getByText(messages.today.estimated)).toBeDefined();

    const fridge = screen.getByRole('link', { name: new RegExp(messages.locations.fridge) });
    expect(within(fridge).getByText('2 Artikel')).toBeDefined();
    expect(fridge.getAttribute('href')).toBe('/inventory?location=fridge');
    const pantry = screen.getByRole('link', { name: new RegExp(messages.locations.pantry) });
    expect(within(pantry).getByText('1 Artikel')).toBeDefined();
    const freezer = screen.getByRole('link', { name: new RegExp(messages.locations.freezer) });
    expect(within(freezer).getByText('leer')).toBeDefined();
    expect(screen.queryByText(messages.today.welcomeTitle)).toBeNull();
  });

  it('shows «Nicht mehr essen» for use-by items past their date', async () => {
    const db = testDb();
    await seedDb(db, [
      { name: 'Hackfleisch', location: 'fridge', inDays: -1, expiryKind: 'use_by' },
    ]);
    renderPage(db);
    expect(await screen.findByText(messages.expiry.doNotEat)).toBeDefined();
  });
});
