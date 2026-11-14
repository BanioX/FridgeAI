import 'fake-indexeddb/auto';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import type { FridgeDb } from '../../data/db';
import { testDb } from '../../data/test-helpers';
import { FeedbackList } from '../household/FeedbackList';
import { FeedbackQuestion } from './FeedbackQuestion';

const t = messages.feedback;

/** Only the date is faked; Dexie keeps its real timers. */
function itIs(instant: string) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(instant));
}

async function show(db: FridgeDb) {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>
        <FeedbackQuestion />
        <FeedbackList />
      </MemoryRouter>
    </AppDataProvider>,
  );
  await new Promise((resolve) => setTimeout(resolve, 50));
}

/** A household created on 2 November. */
async function household(): Promise<FridgeDb> {
  itIs('2026-11-02T08:00:00.000Z');
  const db = testDb();
  await seedDb(db, []);
  return db;
}

describe('FeedbackQuestion', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('waits a week, then asks; the answer stays on the device and can be deleted', async () => {
    const db = await household();
    itIs('2026-11-08T08:00:00.000Z');
    await show(db);
    expect(screen.queryByLabelText(t.question)).toBeNull();
    cleanup();
    itIs('2026-11-09T08:00:00.000Z');
    await show(db);
    const field = await screen.findByLabelText(t.question);
    expect(screen.getByRole('button', { name: t.save })).toHaveProperty('disabled', true);
    await userEvent.type(field, 'Das Datum tippen dauert');
    expect(screen.getByText(t.count(23, 500))).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: t.save }));
    expect(await screen.findByText(t.thanks)).toBeTruthy();
    expect(await screen.findByText('Das Datum tippen dauert')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: t.remove('09.11.2026') }));
    expect(await screen.findByText(t.removed)).toBeTruthy();
    // The message and the list are two live queries: wait for the list on its own (L-33).
    await waitFor(() => {
      expect(screen.queryByText('Das Datum tippen dauert')).toBeNull();
    });
  });

  it('«Später» waits three days, «Nicht mehr fragen» stops', async () => {
    const db = await household();
    itIs('2026-11-10T08:00:00.000Z');
    await show(db);
    await userEvent.click(await screen.findByRole('button', { name: t.later }));
    expect(screen.queryByLabelText(t.question)).toBeNull();
    cleanup();
    itIs('2026-11-13T08:00:00.000Z');
    await show(db);
    await userEvent.click(await screen.findByRole('button', { name: t.never }));
    cleanup();
    itIs('2026-12-20T08:00:00.000Z');
    await show(db);
    expect(screen.queryByLabelText(t.question)).toBeNull();
  });
});
