import 'fake-indexeddb/auto';
import { addDays, MemberSchema, toLocalDate } from '@fridgeai/core';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { browserClock, browserIds } from '../../data/adapters';
import { testDb } from '../../data/test-helpers';
import { bulkText } from './bulk-edit';
import { InventoryPage } from './InventoryPage';

const today = toLocalDate(new Date());

async function seeded(withMia = false) {
  const db = testDb();
  const householdId = await seedDb(db, [
    { name: 'Joghurt', location: 'fridge', inDays: 2 },
    { name: 'Butter', location: 'fridge', inDays: 30 },
    { name: 'Hummus', location: 'fridge', inDays: 1 },
  ]);
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
  return db;
}

function renderPage(db: ReturnType<typeof testDb>) {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={['/inventory']}>
        <InventoryPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

async function openSheet(names: readonly string[]) {
  await screen.findByText(names[0] ?? '');
  await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
  for (const name of names) {
    await userEvent.click(screen.getByRole('checkbox', { name }));
  }
  await userEvent.click(screen.getByRole('button', { name: 'Ändern' }));
  return screen.getByRole('dialog', { name: `${String(names.length)} Artikel ändern` });
}

describe('bulk edit in select mode', () => {
  afterEach(cleanup);

  it('sets the date on all chosen items, keeps the date kind and says so', async () => {
    const db = await seeded();
    renderPage(db);
    const sheet = await openSheet(['Joghurt', 'Butter']);
    expect(within(sheet).getByRole('button', { name: 'Übernehmen' }).hasAttribute('disabled')).toBe(
      true,
    );
    await userEvent.click(within(sheet).getByRole('button', { name: '1 Woche' }));
    await userEvent.click(within(sheet).getByRole('button', { name: 'Übernehmen' }));
    expect(await screen.findByText('2 Artikel geändert.')).toBeDefined();

    const items = await db.items.toArray();
    const byName = async (name: string) => {
      const product = (await db.products.toArray()).find((entry) => entry.name === name);
      return items.find((item) => item.productId === product?.id);
    };
    expect((await byName('Joghurt'))?.expiresOn).toBe(addDays(today, 7));
    expect((await byName('Butter'))?.expiresOn).toBe(addDays(today, 7));
    expect((await byName('Hummus'))?.expiresOn).toBe(addDays(today, 1));
    // Select mode ended, the sheet is gone.
    expect(screen.getByRole('button', { name: 'Auswählen' })).toBeDefined();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('marks only the closed items as opened and skips the others', async () => {
    const db = await seeded();
    renderPage(db);
    let sheet = await openSheet(['Joghurt']);
    await userEvent.click(
      within(sheet).getByRole('button', { name: 'Alle als angebrochen markieren' }),
    );
    expect(await screen.findByText('Joghurt geändert.')).toBeDefined();
    await waitFor(async () => {
      expect((await db.items.toArray()).filter((item) => item.openedOn !== undefined)).toHaveLength(
        1,
      );
    });

    await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Joghurt/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Butter' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ändern' }));
    sheet = screen.getByRole('dialog');
    await userEvent.click(
      within(sheet).getByRole('button', { name: 'Alle als angebrochen markieren' }),
    );
    // Only Butter was still closed.
    expect(await screen.findByText('Butter geändert.')).toBeDefined();
    expect((await db.items.toArray()).filter((item) => item.openedOn !== undefined)).toHaveLength(
      2,
    );
  });

  it('shows the owner choice only with two or more people', async () => {
    renderPage(await seeded(false));
    let sheet = await openSheet(['Joghurt']);
    expect(within(sheet).queryByText('Gehört')).toBeNull();
    cleanup();

    const db = await seeded(true);
    renderPage(db);
    sheet = await openSheet(['Joghurt', 'Butter']);
    expect(within(sheet).getByText('Gehört')).toBeDefined();
    await userEvent.click(within(sheet).getByRole('radio', { name: 'Mia' }));
    await userEvent.click(within(sheet).getByRole('button', { name: 'Übernehmen' }));
    expect(await screen.findByText('2 Artikel geändert.')).toBeDefined();
    const mia = (await db.members.toArray()).find((member) => member.displayName === 'Mia');
    expect((await db.items.toArray()).filter((item) => item.owner === mia?.id)).toHaveLength(2);
  });

  it('closes with Escape and keeps the selection', async () => {
    renderPage(await seeded());
    await openSheet(['Joghurt']);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('1 ausgewählt')).toBeDefined();
  });
});

describe('bulkText', () => {
  it('names what failed and what changed', () => {
    const t = messages.inventory.bulk;
    expect(bulkText(['A', 'B', 'C'], [], false, t)).toBe('3 Artikel geändert.');
    expect(bulkText(['A'], ['Milch'], false, t)).toBe(
      'A geändert. Milch: das hat nicht geklappt. Der Artikel bleibt ausgewählt.',
    );
    expect(bulkText([], [], true, t)).toBe('Alle waren schon angebrochen.');
  });
});
