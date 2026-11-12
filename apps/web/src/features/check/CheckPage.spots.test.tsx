import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { browserClock, browserIds } from '../../data/adapters';
import { createInventoryHandlers } from '../../data/handlers';
import { testDb } from '../../data/test-helpers';
import { CheckPage } from './CheckPage';

async function renderCheck(seed: Parameters<typeof seedDb>[1], spots: Record<string, string> = {}) {
  const db = testDb();
  await seedDb(db, seed);
  const [household] = await db.households.toArray();
  const [member] = await db.members.toArray();
  if (household === undefined || member === undefined) {
    throw new Error('No household');
  }
  const handlers = createInventoryHandlers({
    db,
    clock: browserClock,
    ids: browserIds,
    actor: member.id,
  });
  const stored = await db.items.toArray();
  const products = await db.products.toArray();
  const spotIds = new Map<string, string>();
  for (const [name, spotName] of Object.entries(spots)) {
    const productId = products.find((entry) => entry.name === name)?.id;
    const target = stored.find((entry) => entry.productId === productId);
    if (productId === undefined || target === undefined) {
      throw new Error(`No item ${name}`);
    }
    let spotId = spotIds.get(spotName);
    if (spotId === undefined) {
      ({ spotId } = await handlers['spots.create']({
        commandId: browserIds.next(),
        householdId: household.id,
        name: spotName,
        location: target.location,
      }));
      spotIds.set(spotName, spotId);
    }
    await handlers['products.setSpot']({
      commandId: browserIds.next(),
      householdId: household.id,
      productId,
      spotId,
    });
  }
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>
        <CheckPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

const still = () => screen.getByRole('button', { name: messages.check.still });

describe('Kühlschrank-Check, shelf by shelf (O9)', () => {
  afterEach(cleanup);

  it('asks the spots in the fridge order and names the spot when it changes', async () => {
    await renderCheck(
      [
        { name: 'Hackfleisch', location: 'fridge', inDays: 1, expiryKind: 'use_by' },
        { name: 'Milch', location: 'fridge', inDays: 2, expiryKind: 'use_by' },
        { name: 'Rüebli', location: 'fridge', inDays: 3, expiryKind: 'use_by' },
        { name: 'Resten', location: 'fridge', inDays: 4, expiryKind: 'use_by' },
      ],
      { Rüebli: 'Gemüsefach', Milch: 'Türfach', Hackfleisch: 'Gemüsefach' },
    );
    // Door first, then the drawer (soonest first inside it), the rest without a spot last.
    expect(await screen.findByRole('heading', { level: 2, name: 'Milch' })).toBeDefined();
    expect(screen.getByText('Türfach')).toBeDefined();
    fireEvent.click(still());
    expect(await screen.findByRole('heading', { level: 2, name: 'Hackfleisch' })).toBeDefined();
    expect(screen.getByText('Gemüsefach')).toBeDefined();
    fireEvent.click(still());
    expect(await screen.findByRole('heading', { level: 2, name: 'Rüebli' })).toBeDefined();
    // Same spot as the card before: no new cue.
    expect(screen.queryByText('Gemüsefach')).toBeNull();
    fireEvent.click(still());
    expect(await screen.findByRole('heading', { level: 2, name: 'Resten' })).toBeDefined();
    expect(screen.getByText(messages.check.noSpot)).toBeDefined();
  });

  it('shows no cue when nobody has a spot', async () => {
    await renderCheck([
      { name: 'Milch', location: 'fridge', inDays: 1, expiryKind: 'use_by' },
      { name: 'Joghurt', location: 'fridge', inDays: 2, expiryKind: 'use_by' },
    ]);
    expect(await screen.findByRole('heading', { level: 2, name: 'Milch' })).toBeDefined();
    expect(screen.queryByText(messages.check.noSpot)).toBeNull();
  });
});
