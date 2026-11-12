import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { addDays, formatSwissDate, toLocalDate } from '@fridgeai/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { EditItemPage } from './EditItemPage';

vi.mock('../receipts/read-image', () => ({ readImageText: vi.fn() }));

const t = messages.editItem;
const photoT = messages.addItem.datePhoto;
const photo = () => new File(['x'], 'date.png', { type: 'image/png' });

async function renderPage() {
  const db = testDb();
  await seedDb(db, [{ name: 'Butter', location: 'fridge' }]);
  const [item] = await db.items.toArray();
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={[`/inventory/${item?.id ?? ''}/edit`]}>
        <Routes>
          <Route path="/inventory/:itemId/edit" element={<EditItemPage />} />
          <Route path="*" element={<p>detail</p>} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
  await screen.findByLabelText(t.expiry);
  return db;
}

async function readsAs(text: string) {
  const { readImageText } = await import('../receipts/read-image');
  vi.mocked(readImageText).mockReset();
  vi.mocked(readImageText).mockResolvedValue(text);
}

describe('EditItemPage: «Datum fotografieren» (ADR-0062)', () => {
  afterEach(cleanup);

  it('fills the date from the photo and saves it as read from the label', async () => {
    const db = await renderPage();
    const date = addDays(toLocalDate(new Date()), 400);
    await readsAs(`L23114\nZu verbrauchen bis ${formatSwissDate(date)}`);
    await userEvent.upload(screen.getByLabelText(photoT.choose), photo());
    expect(await screen.findByText(photoT.found(formatSwissDate(date)))).toBeDefined();
    expect(screen.getByLabelText<HTMLInputElement>(t.expiry).value).toBe(formatSwissDate(date));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: t.save }));
    await screen.findByText('detail');
    const [item] = await db.items.toArray();
    expect(item?.expiresOn).toBe(date);
    expect(item?.expiryKind).toBe('use_by');
    expect(item?.expirySource).toBe('label_ocr');
  });

  it('saves a date typed over the photo date as manual', async () => {
    const db = await renderPage();
    const date = addDays(toLocalDate(new Date()), 400);
    await readsAs(`Mindestens haltbar bis ${formatSwissDate(date)}`);
    await userEvent.upload(screen.getByLabelText(photoT.choose), photo());
    await screen.findByText(photoT.found(formatSwissDate(date)));
    const field = screen.getByLabelText(t.expiry);
    await userEvent.clear(field);
    await userEvent.type(field, formatSwissDate(addDays(date, 1)));
    await userEvent.click(screen.getByRole('button', { name: t.save }));
    await screen.findByText('detail');
    const [item] = await db.items.toArray();
    expect(item?.expiresOn).toBe(addDays(date, 1));
    expect(item?.expirySource).toBe('manual');
  });
});
