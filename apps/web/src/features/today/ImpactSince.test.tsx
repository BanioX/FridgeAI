import 'fake-indexeddb/auto';
import { addMonths, IsoDateTimeSchema, rappen, startOfMonth, type Id } from '@fridgeai/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { browserClock, browserIds } from '../../data/adapters';
import { AppDataProvider } from '../../app/AppData';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import type { FridgeDb } from '../../data/db';
import { ImpactSince } from './ImpactSince';

async function wasteIn(db: FridgeDb, householdId: Id, monthsAgo: number, valueRappen: number) {
  const day = addMonths(startOfMonth(browserClock.today()), -monthsAgo);
  await db.outcomes.add({
    id: browserIds.next(),
    householdId,
    updatedAt: browserClock.now(),
    itemId: browserIds.next(),
    outcome: 'wasted',
    quantity: 1,
    valueRappen: rappen(valueRappen),
    valueEstimated: false,
    owner: 'shared',
    at: IsoDateTimeSchema.parse(`${day}T12:00:00.000Z`),
    by: browserIds.next(),
  });
}

function renderIt(db: FridgeDb) {
  render(
    <AppDataProvider db={db}>
      <ImpactSince />
    </AppDataProvider>,
  );
}

describe('ImpactSince', () => {
  afterEach(cleanup);

  it('shows nothing before two completed months', async () => {
    const db = testDb();
    const householdId = await seedDb(db, []);
    await wasteIn(db, householdId, 1, 2010);
    renderIt(db);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText(/Seit deinem ersten Monat/)).toBeNull();
  });

  it('says plainly that less was thrown away', async () => {
    const db = testDb();
    const householdId = await seedDb(db, []);
    await wasteIn(db, householdId, 3, 2010);
    await wasteIn(db, householdId, 1, 1240);
    renderIt(db);
    expect(await screen.findByText(/entsorgst du 38 % weniger/)).toBeDefined();
    expect(screen.getByText(/CHF\s12\.40 statt CHF\s20\.10/)).toBeDefined();
  });

  it('says plainly that more was thrown away', async () => {
    const db = testDb();
    const householdId = await seedDb(db, []);
    await wasteIn(db, householdId, 3, 1000);
    await wasteIn(db, householdId, 1, 1120);
    renderIt(db);
    expect(await screen.findByText(/entsorgst du 12 % mehr/)).toBeDefined();
  });
});
