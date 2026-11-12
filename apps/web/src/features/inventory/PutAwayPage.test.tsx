import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, formatSwissDate, toLocalDate } from '@fridgeai/core';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { browserClock, browserIds } from '../../data/adapters';
import { createInventoryHandlers } from '../../data/handlers';
import { testDb } from '../../data/test-helpers';
import { PutAwayPage } from './PutAwayPage';

vi.mock('../receipts/read-image', () => ({ readImageText: vi.fn() }));

const t = messages.inventory.putAway;

function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

async function renderPage(
  seed: Parameters<typeof seedDb>[1],
  pick: (idOf: (name: string) => string) => string[],
  spots: Record<string, string> = {},
) {
  const db = testDb();
  await seedDb(db, seed);
  const [household] = await db.households.toArray();
  const [member] = await db.members.toArray();
  if (household === undefined || member === undefined) {
    throw new Error('No household');
  }
  const handlers = createInventoryHandlers({
    db,
    clock: browserClock,
    ids: browserIds,
    actor: member.id,
  });
  const stored = await db.items.toArray();
  const products = await db.products.toArray();
  const find = (name: string) => {
    const productId = products.find((entry) => entry.name === name)?.id;
    const found = stored.find((entry) => entry.productId === productId);
    if (found === undefined) {
      throw new Error(`No item ${name}`);
    }
    return found;
  };
  for (const [name, spotName] of Object.entries(spots)) {
    const target = find(name);
    const { spotId } = await handlers['spots.create']({
      commandId: browserIds.next(),
      householdId: household.id,
      name: spotName,
      location: target.location,
    });
    await handlers['products.setSpot']({
      commandId: browserIds.next(),
      householdId: household.id,
      productId: target.productId,
      spotId,
    });
  }
  const query = new URLSearchParams(pick((name) => find(name).id).map((id) => ['item', id]));
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={[`/inventory/put-away?${query.toString()}`]}>
        <Routes>
          <Route path="/inventory/put-away" element={<PutAwayPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
}

describe('PutAwayPage', () => {
  afterEach(cleanup);

  it('lists the new articles per location and spot, with a way on to the Vorrat', async () => {
    await renderPage(
      [
        { name: 'Milch', location: 'fridge' },
        { name: 'Rüebli', location: 'fridge' },
        { name: 'Zucker', location: 'pantry' },
        { name: 'Alt', location: 'freezer' },
      ],
      (idOf) => [idOf('Milch'), idOf('Rüebli'), idOf('Zucker')],
      { Rüebli: 'Gemüsefach' },
    );
    expect(await screen.findByRole('heading', { level: 1, name: t.title })).toBeDefined();
    expect(screen.getByText(t.subline(3))).toBeDefined();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([messages.locations.fridge, messages.locations.pantry]);
    expect(screen.getByRole('heading', { level: 3, name: 'Gemüsefach' })).toBeDefined();
    // Only the fridge has a saved spot, so only there the rest stands under «Ohne festen Platz».
    expect(screen.getAllByRole('heading', { level: 3, name: t.noSpot })).toHaveLength(1);
    expect(screen.queryByText('Alt')).toBeNull();
    expect(screen.getByRole('link', { name: /Milch/ }).getAttribute('href')).toMatch(
      /^\/inventory\/.+/,
    );

    fireEvent.click(screen.getByRole('button', { name: t.done }));
    expect((await screen.findByTestId('where')).textContent).toBe('/inventory?location=fridge');
  });

  it('says «1 Artikel» for one article', async () => {
    await renderPage([{ name: 'Milch', location: 'fridge' }], (idOf) => [idOf('Milch')]);
    expect(await screen.findByText(t.subline(1))).toBeDefined();
    expect(t.subline(1)).toContain('1 Artikel aus');
  });

  it('reads a date from the pack and saves it for that article only', async () => {
    await renderPage(
      [
        { name: 'Milch', location: 'fridge' },
        { name: 'Käse', location: 'fridge', inDays: 30 },
      ],
      (idOf) => [idOf('Milch'), idOf('Käse')],
    );
    // Only an estimated date asks for a photo; the cheese date is known already.
    expect(screen.queryByLabelText(messages.addItem.datePhoto.chooseFor('Käse'))).toBeNull();
    const date = addDays(toLocalDate(new Date()), 400);
    const { readImageText } = await import('../receipts/read-image');
    vi.mocked(readImageText).mockResolvedValue(`Zu verbrauchen bis ${formatSwissDate(date)}`);
    const input = await screen.findByLabelText(messages.addItem.datePhoto.chooseFor('Milch'));
    // The camera is its own control next to the link, never inside it.
    expect(input.closest('a')).toBeNull();
    await userEvent.upload(input, new File(['x'], 'date.png', { type: 'image/png' }));
    expect(await screen.findByText(t.dateSaved('Milch', formatSwissDate(date)))).toBeDefined();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByText(t.expires(formatSwissDate(date), false))).toBeDefined();
  });

  it('goes back to the Vorrat when no listed article exists any more', async () => {
    await renderPage([{ name: 'Milch', location: 'fridge' }], () => ['gone']);
    expect((await screen.findByTestId('where')).textContent).toBe('/inventory');
  });
});
