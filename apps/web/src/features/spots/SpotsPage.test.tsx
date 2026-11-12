import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemberSchema } from '@fridgeai/core';
import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { seedDb } from '../../app/test-seed';
import { browserClock, browserIds } from '../../data/adapters';
import { createInventoryHandlers } from '../../data/handlers';
import { testDb } from '../../data/test-helpers';
import { SpotsPage } from './SpotsPage';

/** Shows where the router is and how it got there. */
function Probe() {
  const location = useLocation();
  const type = useNavigationType();
  return <output data-testid="probe">{`${type} ${location.pathname}${location.search}`}</output>;
}

async function renderSpots(url: string, withMia = false) {
  const db = testDb();
  const miaId = browserIds.next();
  const householdId = await seedDb(db, [
    { name: 'Kristallzucker', location: 'pantry', ...(withMia ? { owner: miaId } : {}) },
    { name: 'Tee', location: 'pantry' },
  ]);
  if (withMia) {
    const now = browserClock.now();
    await db.members.add(
      MemberSchema.parse({
        id: miaId,
        householdId,
        displayName: 'Mia',
        role: 'member',
        joinedAt: now,
        updatedAt: now,
      }),
    );
  }
  const actor = (await db.members.toArray())[0]?.id ?? householdId;
  const handlers = createInventoryHandlers({ db, clock: browserClock, ids: browserIds, actor });
  const { spotId } = await handlers['spots.create']({
    commandId: browserIds.next(),
    householdId,
    name: 'Oberer Schrank links',
    location: 'pantry',
  });
  const product = (await db.products.toArray()).find((entry) => entry.name === 'Kristallzucker');
  await handlers['products.setSpot']({
    commandId: browserIds.next(),
    householdId,
    productId: product?.id ?? householdId,
    spotId,
  });
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={['/more', url]} initialIndex={1}>
        <Probe />
        <Routes>
          <Route path="/more/spots" element={<SpotsPage />} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
}

describe('SpotsPage search in the address (?q=)', () => {
  afterEach(cleanup);

  it('opens with the query in the field, filtered, and shows where the product lies', async () => {
    await renderSpots('/more/spots?q=zucker');
    const field = await screen.findByRole<HTMLInputElement>('searchbox', {
      name: 'Was suchst du?',
    });
    expect(field.value).toBe('zucker');
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Kristallzucker/ }).textContent).toContain(
        'Vorrat · Oberer Schrank links',
      );
    });
    expect(screen.queryByRole('link', { name: /^Tee/ })).toBeNull();
  });

  it('keeps field and address in sync and replaces the entry instead of adding one', async () => {
    await renderSpots('/more/spots');
    const field = await screen.findByRole<HTMLInputElement>('searchbox', {
      name: 'Was suchst du?',
    });
    expect(screen.getByTestId('probe').textContent).toBe('POP /more/spots');

    fireEvent.change(field, { target: { value: 'Te' } });
    expect(screen.getByTestId('probe').textContent).toBe('REPLACE /more/spots?q=Te');
    fireEvent.change(field, { target: { value: 'Tee' } });
    expect(screen.getByTestId('probe').textContent).toBe('REPLACE /more/spots?q=Tee');
    expect(field.value).toBe('Tee');
    await screen.findByRole('link', { name: /^Tee/ });

    fireEvent.change(field, { target: { value: '' } });
    expect(screen.getByTestId('probe').textContent).toBe('REPLACE /more/spots');
    expect(field.value).toBe('');
  });

  it('says so when nothing matches', async () => {
    await renderSpots('/more/spots?q=schokolade');
    expect(
      await screen.findByText(
        'Zu «schokolade» gibt es keinen Treffer bei Artikeln, Plätzen und Personen.',
      ),
    ).toBeDefined();
  });

  it('finds a spot by its name and shows it with what lies there', async () => {
    await renderSpots('/more/spots?q=schrank');
    // The spot as a result and again in the list of spots below.
    expect(await screen.findAllByRole('link', { name: /^Oberer Schrank links/ })).toHaveLength(2);
    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /Kristallzucker/ })).toHaveLength(1);
    });
  });

  it('marks the owner on a result row and finds a person by name with two people', async () => {
    await renderSpots('/more/spots?q=mia', true);
    const row = await screen.findByRole('link', { name: /Kristallzucker/ });
    await waitFor(() => {
      expect(row.textContent).toContain('M');
      expect(screen.getByRole('img', { name: 'Gehört Mia' })).toBeDefined();
    });
    expect(screen.queryByRole('link', { name: /^Tee/ })).toBeNull();
  });
});
