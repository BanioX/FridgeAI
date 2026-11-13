import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { browserClock, browserIds } from '../../data/adapters';
import { ensureLocalHousehold } from '../../data/bootstrap';
import { createInventoryHandlers } from '../../data/handlers';
import { testDb } from '../../data/test-helpers';
import type { FridgeDb } from '../../data/db';
import { ShoppingPage } from './ShoppingPage';

const t = messages.shopping;

/** Two dips in the bin make «dips» a habit. */
async function dbWithDipHabit(): Promise<FridgeDb> {
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
  for (const name of ['Hummus Natur', 'Tzatziki']) {
    const { itemId } = await handlers['inventory.addItem']({
      commandId: browserIds.next(),
      householdId: profile.household.id,
      name,
      location: 'fridge',
    });
    await handlers['inventory.recordOutcome']({
      commandId: browserIds.next(),
      householdId: profile.household.id,
      itemId,
      outcome: 'wasted',
    });
  }
  return db;
}

function renderPage(db: FridgeDb) {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>
        <ShoppingPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

async function addToList(text: string) {
  await userEvent.type(await screen.findByLabelText(t.what), text);
  await userEvent.click(screen.getByRole('button', { name: t.add }));
}

describe('ShoppingPage', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('hints under rows of a habit category only, and shows no share button on an empty list', async () => {
    renderPage(await dbWithDipHabit());
    await screen.findByLabelText(t.what);
    expect(screen.queryByRole('button', { name: t.share })).toBeNull();
    await addToList('Guacamole, Milch');
    await screen.findByRole('checkbox', { name: /Guacamole/ });
    const hints = await screen.findAllByText(/^Entsorgst du oft\./);
    expect(hints).toHaveLength(1);
    expect(hints[0]?.textContent).toContain('kleine Packung');
  });

  it('shares the open entries with Web Share', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, clipboard: { writeText: vi.fn() } });
    renderPage(testDb());
    await addToList('Milch, 2 Joghurt');
    await screen.findByRole('checkbox', { name: /Joghurt/ });
    await userEvent.click(await screen.findByRole('button', { name: t.share }));
    expect(share).toHaveBeenCalledTimes(1);
    const text = (share.mock.calls[0]?.[0] as { text: string }).text;
    expect(text.split('\n')[0]).toBe('Nachkaufen');
    expect(text).toContain('Milch');
    expect(text).toMatch(/2 Stk\. Joghurt/);
  });

  it('falls back to the clipboard and says so, or reports a failure', async () => {
    const writeText = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('no'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderPage(testDb());
    await addToList('Milch');
    await userEvent.click(await screen.findByRole('button', { name: t.share }));
    expect(await screen.findByText(t.copied)).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: t.share }));
    expect(await screen.findByText(t.shareFailed)).toBeDefined();
  });
  it('marks rows the minimum stock created with «Mindestbestand», and only those', async () => {
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
      name: 'Vollmilch',
      location: 'fridge',
    });
    const [product] = await db.products.toArray();
    await handlers['products.setMinStock']({
      commandId: browserIds.next(),
      householdId,
      productId: product?.id ?? '',
      minStock: 1,
    });
    await handlers['inventory.recordOutcome']({
      commandId: browserIds.next(),
      householdId,
      itemId,
      outcome: 'eaten',
    });
    renderPage(db);
    expect(await screen.findByText(messages.minStock.note)).toBeDefined();
    await addToList('Brot');
    // Wait for the end of the add (its message), not only the row: otherwise the rest of the
    // command can run after the test environment is gone («window is not defined» under load).
    expect(await screen.findByText(t.added('Brot'))).toBeDefined();
    expect(screen.getAllByText(messages.minStock.note)).toHaveLength(1);
  });

  it('shows the open entries in blocks by kind in shop order, and checking still works', async () => {
    renderPage(testDb());
    await addToList('Vollmilch, Rüebli, Äpfel');
    await screen.findByRole('checkbox', { name: /Äpfel/ });
    const headings = (await screen.findAllByRole('heading', { level: 2 })).map(
      (heading) => heading.textContent,
    );
    const kinds = messages.inventory.kinds;
    const found = [kinds.fruit, kinds.vegetables, kinds.dairy].map((label) =>
      headings.findIndex((text) => text.includes(label)),
    );
    expect(found.every((index) => index >= 0)).toBe(true);
    expect([...found].sort((a, b) => a - b)).toEqual(found);
    await userEvent.click(screen.getByRole('checkbox', { name: /Rüebli/ }));
    expect(await screen.findByText(t.basket(1))).toBeDefined();
  });

  it('shows the plain list without headings when there is one kind only', async () => {
    renderPage(testDb());
    await addToList('Äpfel, Birnen');
    await screen.findByRole('checkbox', { name: /Birnen/ });
    expect(
      screen.queryByRole('heading', { name: new RegExp(messages.inventory.kinds.fruit) }),
    ).toBeNull();
    expect(screen.getByRole('heading', { name: t.open })).toBeDefined();
  });
});
