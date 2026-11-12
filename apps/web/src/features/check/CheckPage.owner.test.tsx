import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
import { MemberSchema } from '@fridgeai/core';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { seedDb } from '../../app/test-seed';
import { browserClock, browserIds } from '../../data/adapters';
import { testDb } from '../../data/test-helpers';
import { CheckPage } from './CheckPage';

/** One fridge item that belongs to the first person; Mia joins when `withMia` is set. */
async function renderCheck(withMia: boolean, ownedBy: 'first' | 'shared') {
  const db = testDb();
  const householdId = await seedDb(db, []);
  const [first] = await db.members.toArray();
  if (first === undefined) {
    throw new Error('No member');
  }
  if (withMia) {
    const now = browserClock.now();
    await db.members.add(
      MemberSchema.parse({
        id: browserIds.next(),
        householdId,
        displayName: 'Mia',
        role: 'member',
        joinedAt: now,
        updatedAt: now,
      }),
    );
  }
  await seedDb(db, [
    {
      name: 'Schokoladenmousse',
      location: 'fridge',
      inDays: 1,
      expiryKind: 'use_by',
      ...(ownedBy === 'first' ? { owner: first.id } : {}),
    },
  ]);
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>
        <CheckPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
  await screen.findByRole('heading', { level: 2, name: 'Schokoladenmousse' });
}

describe('Kühlschrank-Check: Gehört', () => {
  afterEach(cleanup);

  it('shows who the item belongs to with two people', async () => {
    await renderCheck(true, 'first');
    expect(await screen.findByRole('img', { name: /^Gehört / })).toBeDefined();
  });

  it('shows nothing for shared food', async () => {
    await renderCheck(true, 'shared');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('img', { name: /^Gehört / })).toBeNull();
  });

  it('shows nothing with one person', async () => {
    await renderCheck(false, 'first');
    // Give the live member query time to settle before asserting the absence.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('img', { name: /^Gehört / })).toBeNull();
  });
});
