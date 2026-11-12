import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { ItemDetailPage } from './ItemDetailPage';

async function renderDetail(item: Parameters<typeof seedDb>[1][number]) {
  const db = testDb();
  await seedDb(db, [item]);
  const stored = await db.items.toArray();
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={[`/inventory/${stored[0]?.id ?? ''}`]}>
        <Routes>
          <Route path="/inventory/:itemId" element={<ItemDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
  return db;
}

const kind = messages.itemDetail.kind;
/** The badge is a list item; the switch has the same words as radio labels. */
const badge = () =>
  screen.queryAllByRole('listitem').find((li) => li.textContent === messages.badges.ready);

describe('ItemDetailPage: Zutat oder Fertigprodukt', () => {
  afterEach(cleanup);

  it('shows a dessert as Fertigprodukt, with the badge and the switch on it', async () => {
    await renderDetail({ name: 'Skyr Cheesecake', location: 'fridge' });
    await screen.findByRole('heading', { level: 1, name: 'Skyr Cheesecake' });
    expect(badge()).toBeDefined();
    const ready = screen.getByRole('radio', { name: kind.ready });
    expect((ready as HTMLInputElement).checked).toBe(true);
  });

  it('switches a yoghurt to Fertigprodukt and back, storing only the own call', async () => {
    const db = await renderDetail({ name: 'Naturjoghurt', location: 'fridge' });
    await screen.findByRole('heading', { level: 1, name: 'Naturjoghurt' });
    expect(badge()).toBeUndefined();

    fireEvent.click(screen.getByRole('radio', { name: kind.ready }));
    expect(await screen.findByText(kind.savedReady('Naturjoghurt'))).toBeDefined();
    await waitFor(() => {
      expect(badge()).toBeDefined();
    });
    expect((await db.items.toArray())[0]?.readyMade).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: kind.cook }));
    expect(await screen.findByText(kind.savedCook('Naturjoghurt'))).toBeDefined();
    await waitFor(() => {
      expect(badge()).toBeUndefined();
    });
    // back to the category: nothing stored, the item follows the catalog again
    expect((await db.items.toArray())[0]?.readyMade).toBeUndefined();
  });

  it('lets a dessert count as Zum Kochen', async () => {
    const db = await renderDetail({ name: 'Tiramisu', location: 'fridge' });
    await screen.findByRole('heading', { level: 1, name: 'Tiramisu' });
    fireEvent.click(screen.getByRole('radio', { name: kind.cook }));
    expect(await screen.findByText(kind.savedCook('Tiramisu'))).toBeDefined();
    expect((await db.items.toArray())[0]?.readyMade).toBe(false);
    await waitFor(() => {
      expect(badge()).toBeUndefined();
    });
  });
});
