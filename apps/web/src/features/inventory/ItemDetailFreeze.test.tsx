import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

describe('ItemDetailPage: badges and freeze hint', () => {
  afterEach(cleanup);

  it('freezes suitable food without a hint and shows the Eingefroren badge', async () => {
    await renderDetail({ name: 'Hackfleisch', location: 'fridge' });
    await screen.findByRole('heading', { level: 1, name: 'Hackfleisch' });
    // A freezing tip card may offer the same button; the last one sits under «Mehr».
    const buttons = screen.getAllByRole('button', { name: messages.itemDetail.freeze });
    const last = buttons[buttons.length - 1];
    if (last === undefined) {
      throw new Error('Freeze button missing');
    }
    fireEvent.click(last);
    expect(await screen.findByText(/^Eingefroren \d+\.\d+\.$/)).toBeDefined();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('asks before freezing salad and leaves it alone on «Lieber nicht»', async () => {
    const db = await renderDetail({ name: 'Kopfsalat', location: 'fridge' });
    await screen.findByRole('heading', { level: 1, name: 'Kopfsalat' });
    fireEvent.click(screen.getByRole('button', { name: messages.itemDetail.freeze }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog.textContent).toContain('Salat wird beim Auftauen matschig.');
    fireEvent.click(screen.getByRole('button', { name: messages.freezeHint.keep }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect((await db.items.toArray())[0]?.location).toBe('fridge');
  });

  it('freezes anyway on «Trotzdem einfrieren» and keeps the date', async () => {
    const db = await renderDetail({ name: 'Kopfsalat', location: 'fridge' });
    await screen.findByRole('heading', { level: 1, name: 'Kopfsalat' });
    const before = (await db.items.toArray())[0]?.expiresOn;
    fireEvent.click(screen.getByRole('button', { name: messages.itemDetail.freeze }));
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: messages.freezeHint.force }));
    expect(await screen.findByText(/^Eingefroren \d+\.\d+\.$/)).toBeDefined();
    const after = (await db.items.toArray())[0];
    expect(after?.location).toBe('freezer');
    expect(after?.expiresOn).toBe(before);
  });

  it('shows Aufgetaut after thawing', async () => {
    await renderDetail({ name: 'Hackfleisch', location: 'freezer' });
    await screen.findByRole('heading', { level: 1, name: 'Hackfleisch' });
    fireEvent.click(screen.getByRole('button', { name: messages.itemDetail.thaw }));
    expect(await screen.findByText(messages.badges.thawed)).toBeDefined();
  });
});
