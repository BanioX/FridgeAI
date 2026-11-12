import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

/**
 * A pack of 10 slices, `taken` of them already gone (one undone entry on top). With `perPack` the
 * item is counted in packs of that size (ADR-0066).
 */
async function renderPack(quantity: number, taken: number, perPack?: number) {
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
    ...(perPack === undefined ? {} : { piecesPerPack: perPack }),
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
          <Route path="/inventory" element={<p>Vorrat-Liste</p>} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
  await screen.findByRole('heading', { level: 1, name: 'Schmelzkäse' });
  return { db, itemId };
}

/** The ring as a button: a tap takes one piece. */
const ring = (left: string, start: string) =>
  screen.getByRole('button', { name: t.packTap(left, start) });

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

  it('takes one slice with a tap on the ring and puts it back with «Rückgängig»', async () => {
    const { db, itemId } = await renderPack(10, 0);
    await userEvent.click(ring('10', '10'));
    expect(await screen.findByText(t.packLeft('9', '10'))).toBeDefined();
    expect(screen.getByText(t.packTook('1', 'eaten'))).toBeDefined();
    const live = (await db.outcomes.toArray()).filter((entry) => entry.deletedAt === undefined);
    expect(live.map((entry) => [entry.itemId, entry.outcome, entry.quantity])).toEqual([
      [itemId, 'eaten', 1],
    ]);

    await userEvent.click(screen.getByRole('button', { name: t.undo }));
    expect(await screen.findByText(t.packLeft('10', '10'))).toBeDefined();
    expect(screen.getByText(t.packUndone)).toBeDefined();
    expect((await db.items.get(itemId))?.quantity).toBe(10);
  });

  it('opens the menu with ⋯ or a long press; «1 Stück entsorgt» counts as entsorgt', async () => {
    const { db } = await renderPack(10, 2);
    fireEvent.contextMenu(ring('8', '10'));
    const menu = await screen.findByRole('dialog', { name: t.packLabel('8', '10') });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    await userEvent.click(screen.getByRole('button', { name: t.packMore }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: t.packWasted }),
    );
    expect(await screen.findByText(t.packLeft('7', '10'))).toBeDefined();
    expect(menu.isConnected).toBe(false);
    const wasted = (await db.outcomes.toArray()).filter((entry) => entry.outcome === 'wasted');
    expect(wasted.map((entry) => entry.quantity)).toEqual([1]);
  });

  it('shows the opened pack and says what waits behind it (ADR-0066)', async () => {
    // Two packs of 10, three slices gone: the ring is the opened pack, not all 20.
    await renderPack(20, 3, 10);
    expect(await screen.findByRole('img', { name: t.packLabel('7', '10') })).toBeDefined();
    expect(screen.getByText(t.packBehind(1))).toBeDefined();
    await userEvent.click(ring('7', '10'));
    expect(await screen.findByText(t.packLeft('6', '10'))).toBeDefined();
  });

  it('keeps one status on the page: what a tap did is a polite live region', async () => {
    await renderPack(10, 0);
    await userEvent.click(ring('10', '10'));
    const said = await screen.findByText(t.packTook('1', 'eaten'));
    expect(said.getAttribute('aria-live')).toBe('polite');
    expect(screen.queryAllByRole('status').every((status) => !status.contains(said))).toBe(true);
  });

  it('closes the item when the last slice goes', async () => {
    await renderPack(2, 1);
    await userEvent.click(ring('1', '2'));
    expect(await screen.findByText('Vorrat-Liste')).toBeDefined();
  });
});
