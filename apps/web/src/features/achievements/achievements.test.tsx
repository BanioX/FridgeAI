import 'fake-indexeddb/auto';
import { IsoDateTimeSchema, rappen, type Id } from '@fridgeai/core';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { browserClock, browserIds } from '../../data/adapters';
import type { FridgeDb } from '../../data/db';
import { testDb } from '../../data/test-helpers';
import { AchievementToast } from './AchievementToast';
import { AchievementsPage } from './AchievementsPage';
import { RecentAchievements } from './RecentAchievements';

async function rescueIn(db: FridgeDb, householdId: Id) {
  await db.outcomes.add({
    id: browserIds.next(),
    householdId,
    updatedAt: browserClock.now(),
    itemId: browserIds.next(),
    outcome: 'eaten',
    quantity: 1,
    valueRappen: rappen(250),
    valueEstimated: false,
    rescued: true,
    atRisk: true,
    owner: 'shared',
    at: IsoDateTimeSchema.parse(browserClock.now()),
    by: browserIds.next(),
  });
}

function renderIt(db: FridgeDb, ui: React.ReactNode) {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>{ui}</MemoryRouter>
    </AppDataProvider>,
  );
}

describe('Abzeichen', () => {
  afterEach(cleanup);

  it('lists every achievement by family under a large title, with «‹ Mehr»', async () => {
    const db = testDb();
    await seedDb(db, []);
    renderIt(db, <AchievementsPage />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Abzeichen' })).toBeDefined();
    expect(screen.getByRole('link', { name: messages.pages.more }).getAttribute('href')).toBe(
      '/more',
    );
    const families = Object.values(messages.achievements.families);
    expect(await screen.findAllByRole('img')).toHaveLength(18);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(
      families,
    );
    // Nothing reached yet: open medals say what is missing, as text.
    expect(
      screen.getByRole('img', { name: 'Rettungsdienst, noch offen: noch 10 Rettungen' }),
    ).toBeDefined();
  });

  it('shows a reached achievement with its day and the next step as text', async () => {
    const db = testDb();
    const householdId = await seedDb(db, []);
    await rescueIn(db, householdId);
    renderIt(db, <AchievementsPage />);
    const medal = await screen.findByRole('img', { name: /^Erste Rettung, freigeschaltet am / });
    expect(medal.getAttribute('aria-label')).toMatch(/\d{2}\.\d{2}\.\d{4}$/);
    expect(
      screen.getByRole('img', { name: 'Rettungsdienst, noch offen: noch 9 Rettungen' }),
    ).toBeDefined();
    expect(screen.getByRole('img', { name: /^Sparbuch, noch offen: noch CHF/ })).toBeDefined();
  });

  it('shows nothing on Start until something is unlocked, then the newest with a link', async () => {
    const db = testDb();
    const householdId = await seedDb(db, []);
    renderIt(db, <RecentAchievements />);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText(messages.achievements.startTitle)).toBeNull();
    await rescueIn(db, householdId);
    const title = await screen.findByRole('heading', { name: messages.achievements.startTitle });
    const card = title.closest('div');
    if (card === null) {
      throw new Error('No card');
    }
    expect(within(card).getAllByRole('img')).toHaveLength(1);
    expect(
      within(card).getByRole('link', { name: messages.achievements.startAll }).getAttribute('href'),
    ).toBe('/more/achievements');
  });

  it('says nothing for what was already unlocked when the app opened', async () => {
    const db = testDb();
    const householdId = await seedDb(db, []);
    await rescueIn(db, householdId);
    renderIt(db, <AchievementToast />);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('says «Neues Abzeichen: Erste Rettung.» when a tier newly appears', async () => {
    const db = testDb();
    const householdId = await seedDb(db, []);
    renderIt(db, <AchievementToast />);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByRole('status').textContent).toBe('');
    await rescueIn(db, householdId);
    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Neues Abzeichen: Erste Rettung.');
    });
  });
});
