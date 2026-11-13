import 'fake-indexeddb/auto';
import { addDays, toLocalDate } from '@fridgeai/core';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { TodayPage } from './TodayPage';

const checkRow = new RegExp(`^${messages.pages.check}`);

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

  it('explains Rettich in an empty household, with the two ways in', async () => {
    renderPage();
    const t = messages.today.intro;
    expect(await screen.findByRole('heading', { name: t.title })).toBeDefined();
    expect(screen.getByRole('link', { name: t.receipt }).getAttribute('href')).toBe('/add/receipt');
    expect(screen.getByRole('link', { name: t.item }).getAttribute('href')).toBe('/inventory/new');
    const how = screen.getByRole('region', { name: t.howTitle });
    expect(within(how).getAllByRole('heading', { level: 3 })).toHaveLength(t.steps.length);
    expect(screen.getByText(messages.knowledge.didYouKnow)).toBeDefined();
    // Nothing in stock yet: no empty «Heute retten» list.
    expect(screen.queryByText(messages.today.expiringTitle)).toBeNull();
    expect(screen.queryByText('Lagerorte')).toBeNull();
  });

  it('shows value, one compact row of location tiles and the urgent items with chips', async () => {
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

    // Expiring items link to their detail page.
    const expiringLink = within(list).getAllByRole('link')[0];
    expect(expiringLink?.getAttribute('href')).toMatch(/^\/inventory\/[0-9a-f-]{36}$/);
    // One row of four tiles (Alban, 12.11.2026, after #141 had taken the big ones out): the count
    // per location, the urgent ones as a red number, a tap opens the tab.
    const tiles = screen.getByRole('region', { name: messages.today.locationTiles.title });
    expect(
      within(tiles).getByRole('link', { name: 'Kühlschrank: 2 Artikel, 1 bald fällig' }),
    ).toBeDefined();
    expect(within(tiles).getByRole('link', { name: 'Notvorrat: 1 Artikel' })).toBeDefined();
    expect(screen.queryByText(messages.today.intro.title)).toBeNull();

    // Calm Start (audit, 13.11.2026): what to rescue comes before the tiles, and the fact of the
    // day stays on «Wissen» and after a rescue.
    expect(list.compareDocumentPosition(tiles) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText(messages.knowledge.didYouKnow)).toBeNull();
  });

  it('offers the backup as a quiet row with the link to «Deine Daten»', async () => {
    const db = testDb();
    await seedDb(
      db,
      Array.from({ length: 12 }, (_, index) => ({
        name: `Artikel ${String(index + 1)}`,
        location: 'pantry' as const,
        inDays: 100,
      })),
    );
    // The app counts in Swiss days; a UTC date is one day off just after midnight.
    window.localStorage.setItem('fridgeai:last-backup', addDays(toLocalDate(new Date()), -40));
    renderPage(db);
    const row = await screen.findByRole('link', {
      name: new RegExp(`^${messages.today.backup.title}`),
    });
    expect(row.textContent).toContain('vor 40 Tagen');
    expect(row.getAttribute('href')).toBe('/more/data');
  });

  it('shows «Nicht mehr verwenden» for use-by items past their date', async () => {
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

  it('offers the fridge check only when it is due', async () => {
    const db = testDb();
    await seedDb(db, [{ name: 'Vollmilch', location: 'fridge', inDays: 20 }]);
    const key = 'fridgeai:last-fridge-check';
    const dayOf = (offset: number) => addDays(toLocalDate(new Date()), offset);

    // Checked yesterday: no card.
    window.localStorage.setItem(key, dayOf(-1));
    renderPage(db);
    expect(await screen.findByText(/^CHF\s/)).toBeDefined();
    expect(screen.queryByRole('link', { name: checkRow })).toBeNull();
    cleanup();

    // Checked a week ago: due again.
    window.localStorage.setItem(key, dayOf(-7));
    renderPage(db);
    expect(await screen.findByRole('link', { name: checkRow })).toBeDefined();
    cleanup();

    // Never checked: due.
    window.localStorage.clear();
    renderPage(db);
    expect(await screen.findByRole('link', { name: checkRow })).toBeDefined();
  });

  it('offers one-tap freezing for freezable fridge items due today or tomorrow, with undo', async () => {
    const db = testDb();
    await seedDb(db, [
      { name: 'Hackfleisch', location: 'fridge', inDays: 1, expiryKind: 'use_by' },
      { name: 'Gurke', location: 'fridge', inDays: 1 },
      { name: 'Joghurt', location: 'fridge', inDays: 3 },
    ]);
    renderPage(db);

    const freeze = await screen.findByRole('button', {
      name: messages.rescue.freezeLabel('Hackfleisch'),
    });
    // Cucumber cannot be frozen, yoghurt is not due yet.
    expect(screen.getAllByRole('button', { name: /einfrieren$/ })).toHaveLength(1);

    fireEvent.click(freeze);
    expect(await screen.findByText(/^Hackfleisch eingefroren\. Haltbar bis /)).toBeDefined();
    // The list follows the database a moment later.
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: messages.rescue.freezeLabel('Hackfleisch') }),
      ).toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: messages.inventory.undo }));
    expect(
      await screen.findByRole('button', { name: messages.rescue.freezeLabel('Hackfleisch') }),
    ).toBeDefined();
  });
});
