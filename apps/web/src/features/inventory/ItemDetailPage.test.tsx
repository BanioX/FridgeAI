import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
}

describe('ItemDetailPage rescues', () => {
  afterEach(cleanup);

  it('chooses grams on a wheel (ADR-0083)', async () => {
    await renderDetail({ name: 'Basmatireis', location: 'pantry', quantity: 500, unit: 'g' });
    await screen.findByRole('heading', { level: 1, name: 'Basmatireis' });
    fireEvent.click(screen.getByRole('button', { name: messages.itemDetail.otherAmountOpen }));
    const wheel = screen.getByRole('spinbutton', { name: messages.itemDetail.wheelLabel });
    // It starts at about half and says it in words.
    expect(wheel.getAttribute('aria-valuetext')).toBe('250 g');
    fireEvent.keyDown(wheel, { key: 'ArrowDown' });
    expect(wheel.getAttribute('aria-valuetext')).toBe('260 g');
    fireEvent.keyDown(wheel, { key: 'End' });
    expect(wheel.getAttribute('aria-valuetext')).toBe('500 g');
    fireEvent.keyDown(wheel, { key: 'Home' });
    expect(wheel.getAttribute('aria-valuetext')).toBe('10 g');
    // No portion chip is chosen while the wheel says how much.
    expect(screen.getByRole('radio', { name: 'alles' })).toHaveProperty('checked', false);
  });

  it('shows millilitres and litres on the wheel', async () => {
    await renderDetail({ name: 'Vollmilch', location: 'fridge', quantity: 1500, unit: 'ml' });
    await screen.findByRole('heading', { level: 1, name: 'Vollmilch' });
    fireEvent.click(screen.getByRole('button', { name: messages.itemDetail.otherAmountOpen }));
    const wheel = screen.getByRole('spinbutton', { name: messages.itemDetail.wheelLabel });
    fireEvent.keyDown(wheel, { key: 'End' });
    expect(wheel.getAttribute('aria-valuetext')).toBe('1.5 l');
    fireEvent.keyDown(wheel, { key: 'Home' });
    expect(wheel.getAttribute('aria-valuetext')).toBe('50 ml');
  });

  it('puts «Verwertet» and «Entsorgt» first, «Andere Menge» on request (ADR-0079)', async () => {
    await renderDetail({ name: 'Joghurt', location: 'fridge', inDays: 3 });
    await screen.findByRole('heading', { level: 1, name: 'Joghurt' });
    const outcome = screen.getByRole('heading', {
      level: 2,
      name: messages.itemDetail.whatHappened,
    });
    const spot = screen.getByRole('button', { name: messages.spots.hold });
    expect(outcome.compareDocumentPosition(spot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.getElementById('other-amount')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: messages.itemDetail.otherAmountOpen }));
    expect(document.activeElement?.id).toBe('other-amount');
  });

  it('asks «Ist das noch gut?» before throwing away a best-before item', async () => {
    await renderDetail({ name: 'Joghurt', location: 'fridge', inDays: -1 });
    await screen.findByRole('heading', { level: 1, name: 'Joghurt' });
    expect(screen.queryByText(messages.rescue.stillGood)).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Entsorgt' }));
    expect(screen.getByText(messages.rescue.stillGood)).toBeDefined();
  });

  it('never asks for use-by items', async () => {
    await renderDetail({
      name: 'Hackfleisch',
      location: 'fridge',
      inDays: -1,
      expiryKind: 'use_by',
    });
    await screen.findByRole('heading', { level: 1, name: 'Hackfleisch' });
    fireEvent.click(screen.getByRole('radio', { name: 'Entsorgt' }));
    expect(screen.queryByText(messages.rescue.stillGood)).toBeNull();
  });

  it('freezes with one tap and goes back to the fridge on «Rückgängig»', async () => {
    await renderDetail({
      name: 'Hackfleisch',
      location: 'fridge',
      inDays: 1,
      expiryKind: 'use_by',
    });
    await screen.findByRole('heading', { level: 1, name: 'Hackfleisch' });
    expect(screen.getByText(messages.itemDetail.freezeTip)).toBeDefined();

    const tip = screen.getByText(messages.itemDetail.freezeTip).parentElement;
    if (tip === null) {
      throw new Error('Tip card missing');
    }
    fireEvent.click(within(tip).getByRole('button', { name: messages.rescue.freeze }));
    expect(await screen.findByText(/^Hackfleisch eingefroren\./)).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByText(messages.itemDetail.freezeTip)).toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: messages.itemDetail.undo }));
    expect(await screen.findByText(messages.rescue.unfrozen('Hackfleisch'))).toBeDefined();
    expect(await screen.findByText(messages.itemDetail.freezeTip)).toBeDefined();
  });

  it('offers no freezing tip for food that is not due', async () => {
    await renderDetail({
      name: 'Hackfleisch',
      location: 'fridge',
      inDays: 5,
      expiryKind: 'use_by',
    });
    await screen.findByRole('heading', { level: 1, name: 'Hackfleisch' });
    expect(screen.queryByText(messages.itemDetail.freezeTip)).toBeNull();
  });
});
