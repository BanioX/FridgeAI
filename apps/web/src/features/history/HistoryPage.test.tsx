import 'fake-indexeddb/auto';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemberSchema, type Id } from '@fridgeai/core';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { browserClock, browserIds } from '../../data/adapters';
import { ensureLocalHousehold } from '../../data/bootstrap';
import type { FridgeDb } from '../../data/db';
import { createInventoryHandlers } from '../../data/handlers';
import { testDb } from '../../data/test-helpers';
import { HistoryPage } from './HistoryPage';

const t = messages.history;

/** A household (optionally with Mia as a second person) that baked a cake and ate it. */
async function bakedAndEaten(withMia: boolean) {
  const db = testDb();
  const profile = await ensureLocalHousehold(db, browserClock, browserIds, {
    household: messages.defaults.householdName,
    member: messages.defaults.memberName,
  });
  let owner: Id | 'shared' = 'shared';
  if (withMia) {
    const now = browserClock.now();
    owner = browserIds.next();
    await db.members.add(
      MemberSchema.parse({
        id: owner,
        householdId: profile.household.id,
        displayName: 'Mia',
        role: 'member',
        joinedAt: now,
        updatedAt: now,
      }),
    );
  }
  const householdId = await seedDb(db, [
    { name: 'Bananen', location: 'pantry', priceRappen: 300, owner },
    { name: 'Mehl', location: 'pantry', priceRappen: 150, owner },
  ]);
  const handlers = createInventoryHandlers({
    db,
    clock: browserClock,
    ids: browserIds,
    actor: profile.member.id,
  });
  const { items } = await handlers['inventory.list']({ householdId });
  const done = await handlers['inventory.process']({
    commandId: browserIds.next(),
    householdId,
    ingredients: items.map((item) => ({ itemId: item.id })),
    result: { name: 'Bananenkuchen', kind: 'made' },
  });
  if (done.resultItemId === undefined) {
    throw new Error('The cake was not made');
  }
  await handlers['inventory.recordOutcome']({
    commandId: browserIds.next(),
    householdId,
    itemId: done.resultItemId,
    outcome: 'eaten',
  });
  return { db, handlers, householdId };
}

function renderJournal(db: FridgeDb) {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={['/more/history?outcome=eaten']}>
        <HistoryPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

describe('HistoryPage: processed ingredients', () => {
  afterEach(cleanup);

  it('shows «→ Bananenkuchen» instead of a value and totals like the Bilanz', async () => {
    const { db, handlers, householdId } = await bakedAndEaten(false);
    renderJournal(db);
    const rows = await screen.findAllByRole('listitem');
    expect(rows).toHaveLength(3);
    const banana = rows.find((row) => within(row).queryByText('Bananen') !== null);
    expect(banana?.textContent).toContain(t.madeInto('Bananenkuchen'));
    expect(banana?.textContent).not.toContain('CHF');

    // The cake counts once (CHF 4.50); the ingredients not at all: same as the Bilanz.
    const today = browserClock.today();
    const stats = await handlers['stats.waste']({ householdId, from: today, to: today });
    expect(stats.usedRappen).toBe(450);
    expect(await screen.findByText(t.total('CHF 4.50', 3))).toBeDefined();
  });
});

describe('HistoryPage: owner', () => {
  afterEach(cleanup);

  it('shows the owner badge on the rows with two or more people', async () => {
    const { db } = await bakedAndEaten(true);
    renderJournal(db);
    const badges = await screen.findAllByRole('img', { name: messages.owner.badgeLabel('Mia') });
    // Every row has the owner snapshot of its item: Mia's ingredients and the cake made of them.
    expect(badges).toHaveLength(3);
  });

  it('shows no badge with one person', async () => {
    const { db } = await bakedAndEaten(false);
    renderJournal(db);
    await screen.findAllByRole('listitem');
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});
