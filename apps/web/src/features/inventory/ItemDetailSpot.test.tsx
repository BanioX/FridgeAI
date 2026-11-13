import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { browserClock, browserIds } from '../../data/adapters';
import { createInventoryHandlers } from '../../data/handlers';
import { testDb } from '../../data/test-helpers';
import { ItemDetailPage } from './ItemDetailPage';

const t = messages.spots;

async function renderDetail(name: string, location: 'pantry' | 'fridge') {
  const db = testDb();
  await seedDb(db, [{ name, location }]);
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
  await screen.findByRole('heading', { level: 1, name });
  return db;
}

describe('ItemDetailPage «Platz» (ADR-0056)', () => {
  afterEach(cleanup);

  it('creates a spot by name alone and shows it on the item', async () => {
    const db = await renderDetail('Kristallzucker', 'pantry');
    fireEvent.click(screen.getByRole('button', { name: t.hold }));
    const sheet = await screen.findByRole('dialog', { name: t.sheetTitle });
    fireEvent.click(within(sheet).getByRole('button', { name: t.newSpot }));
    const name = within(sheet).getByLabelText(t.nameLabel);
    expect((name as HTMLInputElement).placeholder).toBe(t.namePlaceholder);
    fireEvent.change(name, { target: { value: 'Oberer Schrank links' } });
    fireEvent.click(within(sheet).getByRole('button', { name: t.save }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(await screen.findByText('Oberer Schrank links')).toBeDefined();
    expect(
      await screen.findByText(t.saved('Kristallzucker', 'Oberer Schrank links')),
    ).toBeDefined();
    const [spot] = await db.spots.toArray();
    expect(spot).toMatchObject({ name: 'Oberer Schrank links', location: 'pantry' });
    expect(spot?.photo).toBeUndefined();
  });

  it('offers only the spots of the location the item is in', async () => {
    const db = await renderDetail('Milch', 'fridge');
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
    for (const [name, location] of [
      ['Gemüsefach', 'fridge'],
      ['Oberer Schrank links', 'pantry'],
    ] as const) {
      await handlers['spots.create']({
        commandId: browserIds.next(),
        householdId: household.id,
        name,
        location,
      });
    }
    fireEvent.click(screen.getByRole('button', { name: t.hold }));
    const sheet = await screen.findByRole('dialog', { name: t.sheetTitle });
    expect(await within(sheet).findByText('Gemüsefach')).toBeDefined();
    expect(within(sheet).queryByText('Oberer Schrank links')).toBeNull();
  });

  it('shows the photo of the current spot large in the sheet, full screen on a tap', async () => {
    const db = await renderDetail('Joghurt', 'fridge');
    const [household] = await db.households.toArray();
    const [member] = await db.members.toArray();
    const [item] = await db.items.toArray();
    if (household === undefined || member === undefined || item === undefined) {
      throw new Error('No household');
    }
    const handlers = createInventoryHandlers({
      db,
      clock: browserClock,
      ids: browserIds,
      actor: member.id,
    });
    const { spotId } = await handlers['spots.create']({
      commandId: browserIds.next(),
      householdId: household.id,
      name: 'Oben',
      location: 'fridge',
      photo: 'data:image/jpeg;base64,AAAA',
    });
    await handlers['products.setSpot']({
      commandId: browserIds.next(),
      householdId: household.id,
      productId: item.productId,
      spotId,
    });
    fireEvent.click(await screen.findByRole('button', { name: /Oben/ }));
    const sheet = await screen.findByRole('dialog', { name: t.sheetTitle });
    fireEvent.click(
      await within(sheet).findByRole('button', { name: messages.photoViewer.open('Oben') }),
    );
    const viewer = screen.getByRole('dialog', { name: 'Oben' });
    expect(viewer.querySelector('img')?.getAttribute('src')).toBe('data:image/jpeg;base64,AAAA');
    // Escape closes the photo first; the sheet stays open.
    fireEvent.keyDown(viewer, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Oben' })).toBeNull();
    expect(screen.getByRole('dialog', { name: t.sheetTitle })).toBeDefined();
  });
});
