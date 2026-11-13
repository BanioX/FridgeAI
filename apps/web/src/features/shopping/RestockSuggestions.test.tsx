import 'fake-indexeddb/auto';
import {
  addDays,
  InventoryItemSchema,
  IsoDateTimeSchema,
  ProductSchema,
  type Id,
} from '@fridgeai/core';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { browserClock, browserIds } from '../../data/adapters';
import { ensureLocalHousehold } from '../../data/bootstrap';
import type { FridgeDb } from '../../data/db';
import { testDb } from '../../data/test-helpers';
import { ShoppingPage } from './ShoppingPage';

const t = messages.restock;

/** A product bought on the given days ago, every pack used up: a rhythm with nothing at home. */
async function dbWithHistory(daysAgo: readonly number[]): Promise<FridgeDb> {
  const db = testDb();
  const profile = await ensureLocalHousehold(db, browserClock, browserIds, {
    household: messages.defaults.householdName,
    member: messages.defaults.memberName,
  });
  const householdId = profile.household.id;
  const now = IsoDateTimeSchema.parse(new Date().toISOString());
  const productId: Id = browserIds.next();
  await db.products.add(
    ProductSchema.parse({
      id: productId,
      householdId,
      updatedAt: now,
      name: 'Vollmilch',
      categoryId: 'dairy-milk',
      defaultLocation: 'fridge',
      source: 'manual',
    }),
  );
  for (const ago of daysAgo) {
    await db.items.add(
      InventoryItemSchema.parse({
        id: browserIds.next(),
        householdId,
        updatedAt: now,
        productId,
        location: 'fridge',
        quantity: 1,
        unit: 'pcs',
        purchasedAt: `${addDays(browserClock.today(), -ago)}T11:00:00.000Z`,
        expiresOn: addDays(browserClock.today(), 5),
        expiryKind: 'best_before',
        expirySource: 'manual',
        owner: 'shared',
        status: 'eaten',
      }),
    );
  }
  return db;
}

function renderPage(db: FridgeDb) {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>
        <ShoppingPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

describe('RestockSuggestions on the shopping page (ADR-0070)', () => {
  afterEach(cleanup);

  it('shows a due product with its rhythm; one tap puts it on the list and the suggestion goes', async () => {
    renderPage(await dbWithHistory([9, 6, 3]));
    await screen.findByRole('heading', { name: t.title });
    expect(screen.getByText('Vollmilch')).toBeDefined();
    expect(screen.getByText(/^etwa alle 3 Tage · zuletzt am \d{1,2}\.\d{1,2}\.$/)).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: t.addLabel('Vollmilch') }));

    expect(await screen.findByRole('checkbox', { name: /Vollmilch/ })).toBeDefined();
    expect(screen.queryByRole('heading', { name: t.title })).toBeNull();
  });

  it('shows no card when nothing is due or the history is too short', async () => {
    renderPage(await dbWithHistory([6, 3]));
    await screen.findByLabelText(messages.shopping.what);
    expect(screen.queryByRole('heading', { name: t.title })).toBeNull();
  });
});
