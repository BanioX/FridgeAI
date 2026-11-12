import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { browserClock, browserIds } from '../../data/adapters';
import { ensureLocalHousehold } from '../../data/bootstrap';
import { createInventoryHandlers } from '../../data/handlers';
import { testDb } from '../../data/test-helpers';
import { ItemDetailPage } from './ItemDetailPage';

const t = messages.itemDetail;

/** A pack of 10 slices, `taken` of them already gone (one undone entry on top). */
async function renderPack(quantity: number, taken: number) {
  const db = testDb();
  const profile = await ensureLocalHousehold(db, browserClock, browserIds, {
    household: messages.defaults.householdName,
    member: messages.defaults.memberName,
  });
  const handlers = createInventoryHandlers({
    db,
    clock: browserClock,
    ids: browserIds,
    actor: profile.member.id,
  });
  const householdId = profile.household.id;
  const { itemId } = await handlers['inventory.addItem']({
    commandId: browserIds.next(),
    householdId,
    name: 'Schmelzkäse',
    location: 'fridge',
    quantity,
    unit: 'pcs',
  });
  const record = (amount: number) =>
    handlers['inventory.recordOutcome']({
      commandId: browserIds.next(),
      householdId,
      itemId,
      outcome: 'eaten',
      quantity: amount,
    });
  if (taken > 0) {
    await record(taken);
  }
  const { eventId } = await record(1);
  await handlers['inventory.undoOutcome']({ commandId: browserIds.next(), householdId, eventId });
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={[`/inventory/${itemId}`]}>
        <Routes>
          <Route path="/inventory/:itemId" element={<ItemDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
  await screen.findByRole('heading', { level: 1, name: 'Schmelzkäse' });
}

describe('ItemDetailPage: what is left of the pack', () => {
  afterEach(cleanup);

  it('shows 7 of 10 slices left; an undone entry does not count', async () => {
    await renderPack(10, 3);
    expect(await screen.findByRole('img', { name: t.packLabel('7', '10') })).toBeDefined();
    expect(screen.getByText(t.packLeft('7', '10'))).toBeDefined();
    expect(screen.getByText(t.packTaken('3'))).toBeDefined();
  });

  it('shows the whole pack before anything went', async () => {
    await renderPack(10, 0);
    expect(await screen.findByText(t.packLeft('10', '10'))).toBeDefined();
    expect(screen.getByText(t.packFull)).toBeDefined();
  });

  it('shows no ring for a single piece', async () => {
    await renderPack(1, 0);
    expect(screen.queryByText(t.packFull)).toBeNull();
    expect(screen.queryByRole('img', { name: /^Packung/ })).toBeNull();
  });
});
