import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { browserClock, browserIds } from '../data/adapters';
import { ensureLocalHousehold } from '../data/bootstrap';
import { testDb } from '../data/test-helpers';
import { AppDataProvider, useAppData } from './AppData';

function Name() {
  return <p data-testid="name">{useAppData().householdName}</p>;
}

describe('AppDataProvider', () => {
  afterEach(cleanup);

  it('provides the stored household name, which the PDF reports print', async () => {
    const db = testDb();
    await ensureLocalHousehold(db, browserClock, browserIds, {
      household: 'WG Musterstrasse',
      member: 'Ich',
    });
    render(
      <AppDataProvider db={db}>
        <Name />
      </AppDataProvider>,
    );
    expect((await screen.findByTestId('name')).textContent).toBe('WG Musterstrasse');
  });
});
