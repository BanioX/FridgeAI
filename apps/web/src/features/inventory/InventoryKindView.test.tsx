import 'fake-indexeddb/auto';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { InventoryPage } from './InventoryPage';

async function seeded() {
  const db = testDb();
  await seedDb(db, [
    { name: 'Äpfel', categoryId: 'produce-apples', location: 'fridge', inDays: 6 },
    { name: 'Lachs', categoryId: 'fish-fresh', location: 'fridge', inDays: 1 },
    { name: 'Rüebli', categoryId: 'produce-carrots', location: 'fridge', inDays: 9 },
    { name: 'Hackfleisch', categoryId: 'meat-minced', location: 'fridge', inDays: 0 },
    { name: 'Birnen', categoryId: 'produce-fruit', location: 'fridge', inDays: 8 },
  ]);
  return db;
}

async function renderPage() {
  const db = await seeded();
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={['/inventory']}>
        <InventoryPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
  await screen.findByText('Lachs');
}

/** The kind blocks: heading id and the names in their rows. */
const blocks = () =>
  [...document.querySelectorAll<HTMLElement>('section[aria-labelledby^="kind-"]')].map((block) => ({
    kind: block.getAttribute('aria-labelledby'),
    items: within(block)
      .queryAllByRole('link')
      .map((link) => /\p{L}+/u.exec(link.textContent)?.[0]),
  }));

describe('InventoryPage «Nach Art»', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(cleanup);

  it('lists by expiry first and switches to blocks by kind, soonest first in each', async () => {
    await renderPage();
    const expiry = screen.getByRole('button', { name: 'Nach Ablauf' });
    expect(expiry.getAttribute('aria-pressed')).toBe('true');
    expect(blocks()).toEqual([]);

    await userEvent.click(screen.getByRole('button', { name: 'Nach Art' }));
    expect(blocks()).toEqual([
      { kind: 'kind-fish', items: ['Lachs'] },
      { kind: 'kind-meat', items: ['Hackfleisch'] },
      { kind: 'kind-vegetables', items: ['Rüebli'] },
      { kind: 'kind-fruit', items: ['Äpfel', 'Birnen'] },
    ]);
    expect(screen.getByRole('heading', { name: 'Früchte, 2 Artikel' })).toBeDefined();
  });

  it('shows one tile per kind with what is due and jumps to its block', async () => {
    await renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Nach Art' }));
    const tiles = within(screen.getByRole('list', { name: 'Arten' })).getAllByRole('button');
    expect(tiles.map((tile) => tile.getAttribute('aria-label'))).toEqual([
      'Fisch, 1 Artikel, 1 bald fällig',
      'Fleisch, 1 Artikel, 1 jetzt fällig',
      'Gemüse, 1 Artikel',
      'Früchte, 2 Artikel',
    ]);
    await userEvent.click(screen.getByRole('button', { name: /^Früchte/ }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: /^Früchte/ }));
  });

  it('remembers the choice on this device', async () => {
    await renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Nach Art' }));
    cleanup();
    await renderPage();
    expect(screen.getByRole('button', { name: 'Nach Art' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(blocks()).toHaveLength(4);
  });

  it('keeps the blocks but hides switch and tiles while choosing', async () => {
    await renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Nach Art' }));
    await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
    expect(screen.queryByRole('button', { name: 'Nach Art' })).toBeNull();
    expect(screen.queryByRole('list', { name: 'Arten' })).toBeNull();
    expect(blocks()).toHaveLength(4);
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  });
});
