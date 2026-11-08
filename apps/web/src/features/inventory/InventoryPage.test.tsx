import 'fake-indexeddb/auto';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { InventoryPage } from './InventoryPage';

function Search() {
  return <output data-testid="search">{useLocation().search}</output>;
}

function renderPage(db = testDb(), path = '/inventory') {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={[path]}>
        <InventoryPage />
        <Search />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

const search = () => screen.getByTestId('search').textContent;

async function seeded() {
  const db = testDb();
  await seedDb(db, [
    { name: 'Vollmilch', location: 'fridge', inDays: 2 },
    { name: 'Erbsen', location: 'freezer', inDays: 100 },
    { name: 'Reis', location: 'pantry', inDays: 200 },
  ]);
  return db;
}

describe('InventoryPage', () => {
  afterEach(cleanup);

  it('shows four tabs with counts and the fridge by default', async () => {
    renderPage(await seeded());
    expect(await screen.findByText('Vollmilch')).toBeDefined();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    const fridge = screen.getByRole('tab', { name: /Kühlschrank/ });
    expect(fridge.getAttribute('aria-selected')).toBe('true');
    expect(fridge.textContent).toContain('1');
    expect(screen.getByRole('tabpanel')).toBeDefined();
    // The ＋ tab is the way to add; no floating button next to a filled list.
    expect(screen.queryByRole('link', { name: messages.inventory.add })).toBeNull();
  });

  it('switches tabs by click and syncs ?location=', async () => {
    renderPage(await seeded());
    await screen.findByText('Vollmilch');
    await userEvent.click(screen.getByRole('tab', { name: /Tiefkühler/ }));
    expect(search()).toBe('?location=freezer');
    expect(await screen.findByText('Erbsen')).toBeDefined();
    expect(screen.queryByText('Vollmilch')).toBeNull();
  });

  it('switches tabs with arrow keys, wrapping around', async () => {
    renderPage(await seeded());
    await screen.findByText('Vollmilch');
    screen.getByRole('tab', { name: /Kühlschrank/ }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(search()).toBe('?location=freezer');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: /Tiefkühler/ }));
    await userEvent.keyboard('{ArrowRight}');
    expect(await screen.findByText('Reis')).toBeDefined();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    expect(search()).toBe('?location=reserve');
  });

  it('reads the initial tab from the URL', async () => {
    renderPage(await seeded(), '/inventory?location=pantry');
    expect(await screen.findByText('Reis')).toBeDefined();
    expect(screen.getByRole('tab', { name: /Vorrat/ }).getAttribute('aria-selected')).toBe('true');
  });

  it('shows the empty text and the Notvorrat tip only on the Notvorrat tab', async () => {
    renderPage(testDb());
    expect(await screen.findByText(messages.inventory.empty)).toBeDefined();
    expect(screen.queryByText(messages.inventory.reserveTip)).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: /Notvorrat/ }));
    expect(screen.getByText(messages.inventory.empty)).toBeDefined();
    expect(screen.getByText(messages.inventory.reserveTip)).toBeDefined();
  });

  it('offers an add link in the empty state, for the open tab', async () => {
    renderPage(testDb(), '/inventory?location=freezer');
    expect(await screen.findByText(messages.inventory.empty)).toBeDefined();
    expect(screen.getByRole('link', { name: messages.inventory.add }).getAttribute('href')).toBe(
      '/inventory/new?location=freezer',
    );
  });

  it('moves a selection and says so; a refused move keeps the selection', async () => {
    renderPage(await seeded());
    await screen.findByText('Vollmilch');
    await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
    expect(screen.queryByRole('link', { name: /Vollmilch/ })).toBeNull();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Vollmilch' }));
    expect(screen.getByText('1 ausgewählt')).toBeDefined();
    // Milk is not suitable for a pantry: it stays, is named, and the selection stays.
    const bar = screen.getByRole('region', { name: 'Auswahl verschieben' });
    await userEvent.click(within(bar).getByRole('button', { name: 'Vorrat' }));
    expect(
      await screen.findByText('Vollmilch gehört nicht in den Vorrat, bleibt hier.'),
    ).toBeDefined();
    expect(screen.getByText('1 ausgewählt')).toBeDefined();
    await userEvent.click(within(bar).getByRole('button', { name: 'Tiefkühler' }));
    expect(await screen.findByText('Vollmilch liegt jetzt im Tiefkühler.')).toBeDefined();
    expect(screen.queryByText('1 ausgewählt')).toBeNull();
    expect(screen.getByRole('button', { name: 'Auswählen' })).toBeDefined();
  });
});
