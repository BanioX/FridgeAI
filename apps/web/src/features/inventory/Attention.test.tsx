import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { InventoryPage } from './InventoryPage';
import { ItemDetailPage } from './ItemDetailPage';

const marker = messages.attention.marker;

async function renderList() {
  const db = testDb();
  await seedDb(db, [
    { name: 'Rinderfilet', location: 'fridge', inDays: 30, priceRappen: 2490 },
    { name: 'Hackfleisch', location: 'fridge', inDays: 1, expiryKind: 'use_by' },
    { name: 'Butter', location: 'fridge', inDays: 30 },
  ]);
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={['/inventory']}>
        <InventoryPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

const rowOf = (name: string) => {
  const row = screen.getByText(name).closest('a');
  if (row === null) {
    throw new Error(`No row for ${name}`);
  }
  return row;
};

describe('«Im Blick» marker in the list', () => {
  afterEach(cleanup);

  it('shows on a pricey and on a use-by article, not on a plain one', async () => {
    await renderList();
    await screen.findByText('Butter');
    await waitFor(() => {
      expect(within(rowOf('Rinderfilet')).getByText(marker)).toBeDefined();
    });
    expect(within(rowOf('Hackfleisch')).getByText(marker)).toBeDefined();
    expect(within(rowOf('Butter')).queryByText(marker)).toBeNull();
  });
});

describe('«Im Blick» on the item page', () => {
  afterEach(cleanup);

  async function renderDetail(item: Parameters<typeof seedDb>[1][number]) {
    const db = testDb();
    await seedDb(db, [item]);
    const [stored] = await db.items.toArray();
    render(
      <AppDataProvider db={db}>
        <MemoryRouter initialEntries={[`/inventory/${stored?.id ?? ''}`]}>
          <Routes>
            <Route path="/inventory/:itemId" element={<ItemDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AppDataProvider>,
    );
  }

  it('opens the overlay with the reason and closes it with Escape', async () => {
    await renderDetail({
      name: 'Hackfleisch',
      location: 'fridge',
      inDays: 1,
      expiryKind: 'use_by',
    });
    const button = await screen.findByRole('button', { name: messages.attention.open });
    fireEvent.click(button);
    const dialog = screen.getByRole('dialog', { name: messages.attention.title });
    // On the body, above the tab bar (ADR-0082).
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(within(dialog).getByText(messages.attention.reasons.use_by)).toBeDefined();
    expect(within(dialog).getByText(messages.attention.tipFreeze)).toBeDefined();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: messages.attention.title })).toBeNull();
    });
  });

  it('closes with the «Schliessen» button', async () => {
    await renderDetail({
      name: 'Hackfleisch',
      location: 'fridge',
      inDays: 1,
      expiryKind: 'use_by',
    });
    fireEvent.click(await screen.findByRole('button', { name: messages.attention.open }));
    fireEvent.click(screen.getByRole('button', { name: messages.attention.close }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has no (i) on a plain article', async () => {
    await renderDetail({ name: 'Butter', location: 'fridge', inDays: 30 });
    await screen.findByRole('heading', { level: 1, name: 'Butter' });
    expect(screen.queryByRole('button', { name: messages.attention.open })).toBeNull();
  });
});
