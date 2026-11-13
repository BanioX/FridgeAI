import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { closedItemFrom } from './closed-item';
import { ItemDetailPage } from './ItemDetailPage';

const t = messages.minStock;

async function renderDetail(name: string) {
  const db = testDb();
  await seedDb(db, [{ name, location: 'fridge', quantity: 2, unit: 'pcs' }]);
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
  await screen.findByRole('heading', { level: 1, name });
  return db;
}

const group = () => screen.getByRole('group', { name: t.legend });

describe('ItemDetailPage «Immer da haben» (ADR-0059)', () => {
  afterEach(cleanup);

  it('is off at first and says what the minimum does', async () => {
    await renderDetail('Vollmilch');
    expect(within(group()).getByRole<HTMLInputElement>('radio', { name: t.off }).checked).toBe(
      true,
    );
    expect(screen.getByText(t.help)).toBeDefined();
  });

  it('sets the minimum on the product with a chip and clears it with «Aus»', async () => {
    const db = await renderDetail('Vollmilch');
    fireEvent.click(within(group()).getByRole('radio', { name: '2' }));
    await waitFor(async () => {
      expect((await db.products.toArray())[0]?.minStock).toBe(2);
    });
    // The page reads the value back through a live query: wait for the render, not only the write.
    await waitFor(() => {
      expect(within(group()).getByRole<HTMLInputElement>('radio', { name: '2' }).checked).toBe(
        true,
      );
    });
    fireEvent.click(within(group()).getByRole('radio', { name: t.off }));
    await waitFor(async () => {
      expect((await db.products.toArray())[0]?.minStock).toBeUndefined();
    });
  });

  it('takes a number from 1 to 20 behind «mehr» and ignores anything else', async () => {
    const db = await renderDetail('Vollmilch');
    fireEvent.click(within(group()).getByRole('radio', { name: t.more }));
    const input = await screen.findByLabelText(t.amountLabel);
    fireEvent.change(input, { target: { value: '21' } });
    fireEvent.blur(input);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect((await db.products.toArray())[0]?.minStock).toBeUndefined();
    fireEvent.change(input, { target: { value: '6' } });
    fireEvent.blur(input);
    await waitFor(async () => {
      expect((await db.products.toArray())[0]?.minStock).toBe(6);
    });
  });

  it('says «Steht jetzt auf «Nachkaufen».» when an outcome puts it on the list', async () => {
    const db = await renderDetail('Vollmilch');
    fireEvent.click(within(group()).getByRole('radio', { name: '2' }));
    await waitFor(async () => {
      expect((await db.products.toArray())[0]?.minStock).toBe(2);
    });
    // One of two pieces: one pack is left, fewer than the minimum of two.
    fireEvent.click(screen.getByRole('button', { name: messages.itemDetail.otherAmountOpen }));
    fireEvent.change(document.getElementById('other-amount') ?? document.body, {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: messages.itemDetail.confirm.eaten }));
    expect(await screen.findByText(new RegExp(t.onList))).toBeDefined();
    const rows = await db.shoppingItems.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'Vollmilch', source: 'min_stock' });
  });
});

describe('closedItemFrom with the minimum stock', () => {
  const id = '019a5a3b-6c00-7000-8000-000000000001';
  const closed = { kind: 'outcome', eventId: id, name: 'Vollmilch', outcome: 'eaten' };

  it('keeps addedToList only when it is exactly true', () => {
    expect(closedItemFrom({ closed: { ...closed, addedToList: true } })).toEqual({
      ...closed,
      addedToList: true,
    });
    expect(closedItemFrom({ closed: { ...closed, addedToList: 'yes' } })).toEqual(closed);
  });
});
