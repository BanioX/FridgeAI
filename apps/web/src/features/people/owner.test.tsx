import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberSchema, type Id } from '@fridgeai/core';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { browserClock, browserIds } from '../../data/adapters';
import { ensureLocalHousehold } from '../../data/bootstrap';
import { createInventoryHandlers } from '../../data/handlers';
import { testDb } from '../../data/test-helpers';
import type { FridgeDb } from '../../data/db';
import { AddItemPage } from '../inventory/AddItemPage';
import { InventoryItemRow } from '../inventory/InventoryItemRow';
import { ItemDetailPage } from '../inventory/ItemDetailPage';

/** Prepares a household, optionally with Mia as a second person. */
async function setup(withMia: boolean) {
  const db = testDb();
  const profile = await ensureLocalHousehold(db, browserClock, browserIds, {
    household: messages.defaults.householdName,
    member: messages.defaults.memberName,
  });
  let mia: Id | undefined;
  if (withMia) {
    const now = browserClock.now();
    mia = browserIds.next();
    await db.members.add(
      MemberSchema.parse({
        id: mia,
        householdId: profile.household.id,
        displayName: 'Mia',
        role: 'member',
        joinedAt: now,
        updatedAt: now,
      }),
    );
  }
  return { db, mia, profile };
}

async function itemOf(db: FridgeDb) {
  const profile = await ensureLocalHousehold(db, browserClock, browserIds, {
    household: '',
    member: '',
  });
  const handlers = createInventoryHandlers({
    db,
    clock: browserClock,
    ids: browserIds,
    actor: profile.member.id,
  });
  const { items } = await handlers['inventory.list']({ householdId: profile.household.id });
  const [item] = items;
  if (item === undefined) {
    throw new Error('No item seeded');
  }
  return item;
}

const moreButton = () => screen.getByText(new RegExp(`^${messages.addItem.more}`));

describe('add form: Gehört', () => {
  afterEach(cleanup);

  function renderAdd(db: FridgeDb) {
    render(
      <AppDataProvider db={db}>
        <MemoryRouter>
          <AddItemPage />
        </MemoryRouter>
      </AppDataProvider>,
    );
    return screen.findByLabelText(messages.addItem.name);
  }

  it('hides the choice with one person', async () => {
    const { db } = await setup(false);
    await renderAdd(db);
    expect(screen.queryByText(messages.owner.legend)).toBeNull();
    expect(moreButton().textContent).not.toContain(messages.owner.badgeLabel(''));
  });

  it('offers «Allen» (chosen) and one chip per person with two or more people', async () => {
    const { db } = await setup(true);
    await renderAdd(db);
    expect(await screen.findByText(messages.owner.legend)).toBeDefined();
    const everyone = screen.getByRole<HTMLInputElement>('radio', { name: messages.owner.everyone });
    expect(everyone.checked).toBe(true);
    expect(screen.getByRole('radio', { name: 'Mia' })).toBeDefined();
    expect(screen.getByRole('radio', { name: messages.defaults.memberName })).toBeDefined();
    expect(moreButton().textContent).not.toContain('Mia');
  });

  it('mentions the owner in the summary only when it is not «Allen»', async () => {
    const { db } = await setup(true);
    await renderAdd(db);
    await userEvent.click(await screen.findByRole('radio', { name: 'Mia' }));
    expect(moreButton().textContent).toContain(messages.addItem.ownerSummary('Mia'));
    await userEvent.click(screen.getByRole('radio', { name: messages.owner.everyone }));
    expect(moreButton().textContent).not.toContain('Mia');
  });

  it('saves the item with its owner', async () => {
    const { db, mia } = await setup(true);
    await renderAdd(db);
    await userEvent.type(screen.getByLabelText(messages.addItem.name), 'Schokoladenmousse');
    await userEvent.click(await screen.findByRole('radio', { name: 'Mia' }));
    await userEvent.click(screen.getByRole('button', { name: messages.addItem.save }));
    await eventually(async () => (await db.items.toArray())[0]?.owner === mia);
  });
});

/** Polls until the check passes (the save runs after the click). */
async function eventually(check: () => Promise<boolean>) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('The item was not saved with its owner');
}

describe('inventory row: Gehört', () => {
  afterEach(cleanup);

  async function renderRow(db: FridgeDb) {
    const item = await itemOf(db);
    render(
      <AppDataProvider db={db}>
        <MemoryRouter>
          <InventoryItemRow item={item} status={{ tone: 'fresh', label: 'Frisch' }} />
        </MemoryRouter>
      </AppDataProvider>,
    );
    await screen.findByText(item.name);
  }

  it('shows no badge for food that belongs to everyone', async () => {
    const { db } = await setup(true);
    await seedDb(db, [{ name: 'Vollmilch', location: 'fridge' }]);
    await renderRow(db);
    expect(screen.queryByRole('img', { name: /^Gehört/ })).toBeNull();
  });

  it('shows the initials with «Gehört Mia» for its owner, without touching the meta line', async () => {
    const { db, mia } = await setup(true);
    await seedDb(db, [
      {
        name: 'Schokoladenmousse',
        location: 'fridge',
        ...(mia === undefined ? {} : { owner: mia }),
      },
    ]);
    await renderRow(db);
    const badge = await screen.findByRole('img', { name: 'Gehört Mia' });
    expect(badge.textContent).toBe('M');
    expect(screen.getByText('1 Stk. · Kühlschrank')).toBeDefined();
  });
});

describe('item page: Gehört', () => {
  afterEach(cleanup);

  async function renderDetail(db: FridgeDb) {
    const item = await itemOf(db);
    render(
      <AppDataProvider db={db}>
        <MemoryRouter initialEntries={[`/inventory/${item.id}`]}>
          <Routes>
            <Route path="/inventory/:itemId" element={<ItemDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AppDataProvider>,
    );
    await screen.findByRole('heading', { level: 1, name: item.name });
  }

  it('has no «Gehört» row with one person', async () => {
    const { db } = await setup(false);
    await seedDb(db, [{ name: 'Vollmilch', location: 'fridge' }]);
    await renderDetail(db);
    expect(screen.queryByRole('heading', { name: messages.owner.legend })).toBeNull();
  });

  it('shows the calm line for an owned item and drops it when set back to «Allen»', async () => {
    const { db, mia } = await setup(true);
    await seedDb(db, [
      {
        name: 'Schokoladenmousse',
        location: 'fridge',
        ...(mia === undefined ? {} : { owner: mia }),
      },
    ]);
    await renderDetail(db);
    expect(await screen.findByText(messages.owner.ask('Mia'))).toBeDefined();
    await userEvent.click(screen.getByRole('radio', { name: messages.owner.everyone }));
    await eventually(async () => (await db.items.toArray())[0]?.owner === 'shared');
    expect(await screen.findByRole('heading', { name: messages.owner.legend })).toBeDefined();
    await eventually(() => Promise.resolve(screen.queryByText(messages.owner.ask('Mia')) === null));
  });

  it('marks an item as belonging to someone', async () => {
    const { db, mia } = await setup(true);
    await seedDb(db, [{ name: 'Vollmilch', location: 'fridge' }]);
    await renderDetail(db);
    await userEvent.click(await screen.findByRole('radio', { name: 'Mia' }));
    await eventually(async () => (await db.items.toArray())[0]?.owner === mia);
    expect(await screen.findByText(messages.owner.ask('Mia'))).toBeDefined();
  });
});
