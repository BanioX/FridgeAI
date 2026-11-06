import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
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
    expect(screen.getByRole('link', { name: messages.inventory.add }).getAttribute('href')).toBe(
      '/inventory/new',
    );
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
});
