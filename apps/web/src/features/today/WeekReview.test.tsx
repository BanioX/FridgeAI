import 'fake-indexeddb/auto';
import { IsoDateTimeSchema, rappen, type Id } from '@fridgeai/core';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { browserIds } from '../../data/adapters';
import type { FridgeDb } from '../../data/db';
import { testDb } from '../../data/test-helpers';
import { WeekReview } from './WeekReview';

const t = messages.today;

async function closeOn(
  db: FridgeDb,
  householdId: Id,
  day: string,
  outcome: 'eaten' | 'wasted',
  value: number,
) {
  await db.outcomes.add({
    id: browserIds.next(),
    householdId,
    updatedAt: IsoDateTimeSchema.parse(`${day}T12:00:00.000Z`),
    itemId: browserIds.next(),
    outcome,
    quantity: 1,
    valueRappen: rappen(value),
    valueEstimated: false,
    owner: 'shared',
    at: IsoDateTimeSchema.parse(`${day}T12:00:00.000Z`),
    by: browserIds.next(),
  });
}

/** Only the date is faked; Dexie keeps its real timers. */
function itIs(instant: string) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(instant));
}

async function show(db: FridgeDb) {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>
        <WeekReview />
      </MemoryRouter>
    </AppDataProvider>,
  );
  await new Promise((resolve) => setTimeout(resolve, 50));
}

describe('WeekReview', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('looks back at last week on a Monday, until «Gesehen»', async () => {
    itIs('2026-11-16T08:00:00.000Z');
    const db = testDb();
    const householdId = await seedDb(db, []);
    await closeOn(db, householdId, '2026-11-10', 'eaten', 1840);
    await closeOn(db, householdId, '2026-11-12', 'wasted', 210);
    // Outside the week: not counted.
    await closeOn(db, householdId, '2026-11-03', 'wasted', 999);
    await show(db);
    expect(await screen.findByRole('heading', { name: t.weekTitle })).toBeTruthy();
    expect(screen.getByText(t.weekPeriod('09.11.2026', '15.11.2026'))).toBeTruthy();
    expect(screen.getByText(/18\.40/)).toBeTruthy();
    expect(screen.getByText(/2\.10/)).toBeTruthy();
    expect(screen.getByRole('link', { name: t.weekJournal })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: t.weekSeen }));
    expect(screen.queryByRole('heading', { name: t.weekTitle })).toBeNull();
    expect(window.localStorage.getItem('fridgeai:week-review-seen')).toBe('2026-11-09');
  });

  it('keeps quiet from Thursday on and after a week without anything closed', async () => {
    itIs('2026-11-19T08:00:00.000Z');
    const db = testDb();
    const householdId = await seedDb(db, []);
    await closeOn(db, householdId, '2026-11-10', 'eaten', 500);
    await show(db);
    expect(screen.queryByRole('heading', { name: t.weekTitle })).toBeNull();
    cleanup();
    itIs('2026-11-16T08:00:00.000Z');
    await show(testDb());
    expect(screen.queryByRole('heading', { name: t.weekTitle })).toBeNull();
  });

  it('says so when nothing was thrown away', async () => {
    itIs('2026-11-17T08:00:00.000Z');
    const db = testDb();
    const householdId = await seedDb(db, []);
    await closeOn(db, householdId, '2026-11-11', 'eaten', 500);
    await show(db);
    expect(await screen.findByText(t.weekNoWaste)).toBeTruthy();
  });
});
