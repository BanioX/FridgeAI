import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { CheckPage } from './CheckPage';

describe('Kühlschrank-Check and «Treu»', () => {
  afterEach(cleanup);

  it('records the event check.completed once, when the check is finished', async () => {
    const db = testDb();
    await seedDb(db, [
      { name: 'Hackfleisch', location: 'fridge', inDays: 1, expiryKind: 'use_by' },
    ]);
    render(
      <AppDataProvider db={db}>
        <MemoryRouter>
          <CheckPage />
        </MemoryRouter>
      </AppDataProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: messages.check.still }));
    expect(await screen.findByText(messages.check.doneTitle)).toBeDefined();
    await waitFor(async () => {
      const events = (await db.events.toArray()).filter((e) => e.type === 'check.completed');
      expect(events).toHaveLength(1);
      expect(events[0]?.payload).toEqual({ itemCount: 1 });
    });
  });
});
