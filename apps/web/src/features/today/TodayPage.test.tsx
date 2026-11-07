import 'fake-indexeddb/auto';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(cleanup);

  it('shows the welcome card for an empty household', async () => {
    renderPage();
    expect(await screen.findByText(messages.today.welcomeTitle)).toBeDefined();
    const link = screen.getByRole('link', { name: messages.today.firstItem });
    expect(link.getAttribute('href')).toBe('/inventory/new');
    expect(screen.getByText(messages.today.expiringEmpty)).toBeDefined();
    expect(screen.queryByText('Lagerorte')).toBeNull();
  });

  it('shows value and the urgent items with chips, without location tiles', async () => {
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

    // Expiring items link to their detail page; the storage locations live in the Vorrat tabs.
    const expiringLink = within(list).getAllByRole('link')[0];
    expect(expiringLink?.getAttribute('href')).toMatch(/^\/inventory\/[0-9a-f-]{36}$/);
    expect(screen.queryByText('Lagerorte')).toBeNull();
    expect(screen.queryByText(/\d+ Artikel$/)).toBeNull();
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

  it('leaves the Notvorrat out unless it is due or past', async () => {
    const db = testDb();
    await seedDb(db, [
      { name: 'Hackfleisch', location: 'fridge', inDays: 1 },
      { name: 'Notfall-Reis', location: 'reserve', inDays: 30 },
      { name: 'Altes Wasser', location: 'reserve', inDays: -1 },
    ]);
    renderPage(db);
    const list = within(await screen.findByRole('region', { name: messages.today.expiringTitle }));
    expect(await list.findByText('Hackfleisch')).toBeDefined();
    expect(list.getByText('Altes Wasser')).toBeDefined();
    expect(list.queryByText('Notfall-Reis')).toBeNull();
  });

  it('lists at most five rows and links to «Alle anzeigen»', async () => {
    const db = testDb();
    await seedDb(
      db,
      [0, 1, 1, 2, 2, 2, -1].map((inDays, index) => ({
        name: `Artikel ${String(index + 1)}`,
        location: 'fridge' as const,
        inDays,
      })),
    );
    renderPage(db);
    const list = within(await screen.findByRole('region', { name: messages.today.expiringTitle }));
    expect(await list.findByText('Artikel 7')).toBeDefined();
    expect(list.getAllByRole('listitem')).toHaveLength(5);
    const more = list.getByRole('link', { name: messages.today.showAll(7) });
    expect(more.getAttribute('href')).toBe('/inventory');
  });

  it('shows no «Alle anzeigen» for five or fewer urgent items', async () => {
    const db = testDb();
    await seedDb(db, [{ name: 'Hackfleisch', location: 'fridge', inDays: 1 }]);
    renderPage(db);
    expect(await screen.findByText('Hackfleisch')).toBeDefined();
    expect(screen.queryByRole('link', { name: /^Alle anzeigen/ })).toBeNull();
  });

  it('suggests exactly one recipe with a link to «Kochen»', async () => {
    const db = testDb();
    await seedDb(db, [{ name: 'Vollmilch', location: 'fridge', inDays: 1 }]);
    renderPage(db);
    const ideas = within(await screen.findByRole('region', { name: messages.recipes.rescueTitle }));
    const recipeLinks = ideas
      .getAllByRole('link')
      .filter((link) => (link.getAttribute('href') ?? '').startsWith('/recipes/'));
    expect(recipeLinks).toHaveLength(1);
    const more = ideas.getByRole('link', { name: messages.recipes.moreRecipes });
    expect(more.getAttribute('href')).toBe('/cook');
  });

  it('hides the recipe block when nothing is worth rescuing', async () => {
    const db = testDb();
    await seedDb(db, [{ name: 'Vollmilch', location: 'fridge', inDays: 20 }]);
    renderPage(db);
    expect(await screen.findByText(/^CHF\s/)).toBeDefined();
    expect(screen.queryByRole('region', { name: messages.recipes.rescueTitle })).toBeNull();
    expect(screen.queryByRole('link', { name: messages.recipes.moreRecipes })).toBeNull();
  });

  it('offers the fridge check only when it is due', async () => {
    const db = testDb();
    await seedDb(db, [{ name: 'Vollmilch', location: 'fridge', inDays: 20 }]);
    const key = 'fridgeai:last-fridge-check';
    const dayOf = (offset: number) => {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${String(date.getFullYear())}-${month}-${day}`;
    };

    // Checked yesterday: no card.
    window.localStorage.setItem(key, dayOf(-1));
    renderPage(db);
    expect(await screen.findByText(/^CHF\s/)).toBeDefined();
    expect(screen.queryByRole('link', { name: messages.check.cardStart })).toBeNull();
    cleanup();

    // Checked a week ago: due again.
    window.localStorage.setItem(key, dayOf(-7));
    renderPage(db);
    expect(await screen.findByRole('link', { name: messages.check.cardStart })).toBeDefined();
    cleanup();

    // Never checked: due.
    window.localStorage.clear();
    renderPage(db);
    expect(await screen.findByRole('link', { name: messages.check.cardStart })).toBeDefined();
  });
});
