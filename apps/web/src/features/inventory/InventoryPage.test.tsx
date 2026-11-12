import 'fake-indexeddb/auto';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { InventoryPage } from './InventoryPage';

function Search() {
  const { pathname, search } = useLocation();
  return (
    <>
      <output data-testid="search">{search}</output>
      <output data-testid="path">{pathname}</output>
    </>
  );
}

function renderPage(db = testDb(), path = '/inventory') {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={[path]}>
        <InventoryPage />
        <Search />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

const search = () => screen.getByTestId('search').textContent;
const path = () => screen.getByTestId('path').textContent;

async function seeded() {
  const db = testDb();
  await seedDb(db, [
    { name: 'Vollmilch', location: 'fridge', inDays: 2 },
    { name: 'Erbsen', location: 'freezer', inDays: 100 },
    { name: 'Reis', location: 'pantry', inDays: 200 },
  ]);
  return db;
}

describe('InventoryPage', () => {
  afterEach(cleanup);

  it('shows four tabs with counts and the fridge by default', async () => {
    renderPage(await seeded());
    expect(await screen.findByText('Vollmilch')).toBeDefined();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    const fridge = screen.getByRole('tab', { name: /Kühlschrank/ });
    expect(fridge.getAttribute('aria-selected')).toBe('true');
    expect(fridge.textContent).toContain('1');
    expect(screen.getByRole('tabpanel')).toBeDefined();
    // The ＋ tab is the way to add; no floating button next to a filled list.
    expect(screen.queryByRole('link', { name: messages.inventory.add })).toBeNull();
  });

  it('switches tabs by click and syncs ?location=', async () => {
    renderPage(await seeded());
    await screen.findByText('Vollmilch');
    await userEvent.click(screen.getByRole('tab', { name: /Tiefkühler/ }));
    expect(search()).toBe('?location=freezer');
    expect(await screen.findByText('Erbsen')).toBeDefined();
    expect(screen.queryByText('Vollmilch')).toBeNull();
  });

  it('switches tabs with arrow keys, wrapping around', async () => {
    renderPage(await seeded());
    await screen.findByText('Vollmilch');
    screen.getByRole('tab', { name: /Kühlschrank/ }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(search()).toBe('?location=freezer');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: /Tiefkühler/ }));
    await userEvent.keyboard('{ArrowRight}');
    expect(await screen.findByText('Reis')).toBeDefined();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    expect(search()).toBe('?location=reserve');
  });

  it('reads the initial tab from the URL', async () => {
    renderPage(await seeded(), '/inventory?location=pantry');
    expect(await screen.findByText('Reis')).toBeDefined();
    expect(screen.getByRole('tab', { name: /Vorrat/ }).getAttribute('aria-selected')).toBe('true');
  });

  it('shows the empty text and the Notvorrat tip only on the Notvorrat tab', async () => {
    renderPage(testDb());
    expect(await screen.findByText(messages.inventory.empty)).toBeDefined();
    expect(screen.queryByText(messages.inventory.reserveTip)).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: /Notvorrat/ }));
    expect(screen.getByText(messages.inventory.empty)).toBeDefined();
    expect(screen.getByText(messages.inventory.reserveTip)).toBeDefined();
  });

  it('offers an add link in the empty state, for the open tab', async () => {
    renderPage(testDb(), '/inventory?location=freezer');
    expect(await screen.findByText(messages.inventory.empty)).toBeDefined();
    expect(screen.getByRole('link', { name: messages.inventory.add }).getAttribute('href')).toBe(
      '/inventory/new?location=freezer',
    );
  });

  it('moves a selection and says so; a refused move keeps the selection', async () => {
    renderPage(await seeded());
    await screen.findByText('Vollmilch');
    await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
    expect(screen.queryByRole('link', { name: /Vollmilch/ })).toBeNull();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Vollmilch' }));
    expect(screen.getByText('1 ausgewählt')).toBeDefined();
    // Milk is not suitable for a pantry: it stays, is named, and the selection stays.
    const bar = screen.getByRole('region', { name: 'Auswahl verschieben' });
    await userEvent.click(within(bar).getByRole('button', { name: 'Vorrat' }));
    expect(
      await screen.findByText('Vollmilch gehört nicht in den Vorrat, bleibt hier.'),
    ).toBeDefined();
    expect(screen.getByText('1 ausgewählt')).toBeDefined();
    await userEvent.click(within(bar).getByRole('button', { name: 'Tiefkühler' }));
    expect(await screen.findByText('Vollmilch liegt jetzt im Tiefkühler.')).toBeDefined();
    expect(screen.queryByText('1 ausgewählt')).toBeNull();
    expect(screen.getByRole('button', { name: 'Auswählen' })).toBeDefined();
  });
  describe('the pots', () => {
    async function seededPots() {
      const db = testDb();
      await seedDb(db, [
        { name: 'Joghurt', location: 'fridge', inDays: 5 },
        { name: 'Butter', location: 'fridge', inDays: 30 },
        { name: 'Hummus', location: 'fridge', inDays: 0 },
      ]);
      return db;
    }
    const itemIdOf = async (db: ReturnType<typeof testDb>, name: string) => {
      const product = (await db.products.toArray()).find((entry) => entry.name === name);
      return (await db.items.toArray()).find((item) => item.productId === product?.id)?.id;
    };
    const pots = () => screen.getByRole('region', { name: 'Auswahl abschliessen' });

    it('appear only in select mode and stay disabled until something is chosen', async () => {
      renderPage(await seededPots());
      await screen.findByText('Joghurt');
      expect(screen.queryByRole('region', { name: 'Auswahl abschliessen' })).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
      const verwertet = within(pots()).getByRole('button', { name: 'Verwertet' });
      expect((verwertet as HTMLButtonElement).disabled).toBe(true);
      await userEvent.click(screen.getByRole('checkbox', { name: 'Joghurt' }));
      expect((verwertet as HTMLButtonElement).disabled).toBe(false);
    });

    it('records the whole rest as verwertet, says so and takes it back with Rückgängig', async () => {
      const db = await seededPots();
      renderPage(db);
      await screen.findByText('Joghurt');
      await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Joghurt' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Butter' }));
      await userEvent.click(within(pots()).getByRole('button', { name: 'Verwertet' }));
      expect(await screen.findByText('2 Artikel verwertet.')).toBeDefined();
      expect(await db.outcomes.toArray()).toHaveLength(2);
      expect((await db.outcomes.toArray()).every((o) => o.outcome === 'eaten')).toBe(true);
      // Select mode ended.
      expect(screen.getByRole('button', { name: 'Auswählen' })).toBeDefined();

      await userEvent.click(screen.getByRole('button', { name: 'Rückgängig' }));
      await waitFor(async () => {
        expect((await db.items.toArray()).every((item) => item.status === 'active')).toBe(true);
      });
    });

    it('records entsorgt without a reason and adds the calm hint for best-before food', async () => {
      const db = await seededPots();
      renderPage(db);
      await screen.findByText('Joghurt');
      await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Joghurt' }));
      await userEvent.click(within(pots()).getByRole('button', { name: 'Entsorgt' }));
      expect(await screen.findByText('Joghurt entsorgt.')).toBeDefined();
      expect(screen.getByText(messages.rescue.stillGood)).toBeDefined();
      const [outcome] = await db.outcomes.toArray();
      expect(outcome).toMatchObject({ outcome: 'wasted' });
      expect(outcome?.wasteReason).toBeUndefined();
    });

    it('asks the rescue question once for food due today; only «Ja» counts as rescued', async () => {
      const db = await seededPots();
      renderPage(db);
      await screen.findByText('Hummus');
      await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Hummus' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Butter' }));
      await userEvent.click(within(pots()).getByRole('button', { name: 'Verwertet' }));

      const sheet = await screen.findByRole('alertdialog');
      expect(
        within(sheet).getByText(messages.itemDetail.rescueQuestion, { selector: 'h2' }),
      ).toBeDefined();
      expect(within(sheet).getByText('Hummus')).toBeDefined();
      expect(within(sheet).queryByText('Butter')).toBeNull();
      expect(within(sheet).getByRole('radio', { name: 'Nein' })).toHaveProperty('checked', true);
      await userEvent.click(within(sheet).getByRole('radio', { name: 'Ja, gerettet' }));
      await userEvent.click(within(sheet).getByRole('button', { name: 'Als verwertet speichern' }));
      expect(await screen.findByText('2 Artikel verwertet.')).toBeDefined();

      const outcomes = await db.outcomes.toArray();
      expect(outcomes).toHaveLength(2);
      expect(outcomes.filter((o) => o.rescued === true).map((o) => o.itemId)).toEqual([
        await itemIdOf(db, 'Hummus'),
      ]);
    });

    it('records nothing when the rescue question is cancelled', async () => {
      const db = await seededPots();
      renderPage(db);
      await screen.findByText('Hummus');
      await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Hummus' }));
      await userEvent.click(within(pots()).getByRole('button', { name: 'Verwertet' }));
      await userEvent.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }),
      );
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(await db.outcomes.toArray()).toHaveLength(0);
      expect(screen.getByText('1 ausgewählt')).toBeDefined();
    });

    it('puts the products on the shopping list and keeps them in stock', async () => {
      const db = await seededPots();
      renderPage(db);
      await screen.findByText('Joghurt');
      await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Joghurt' }));
      await userEvent.click(within(pots()).getByRole('button', { name: 'Nachkaufen' }));
      expect(await screen.findByText('Joghurt steht bei «Nachkaufen».')).toBeDefined();
      expect(await db.shoppingItems.toArray()).toMatchObject([{ name: 'Joghurt' }]);
      expect((await db.items.toArray()).every((item) => item.status === 'active')).toBe(true);
      expect(screen.getByRole('button', { name: 'Auswählen' })).toBeDefined();
    });

    it('opens «Verarbeiten» with all chosen items and leaves select mode', async () => {
      const db = await seededPots();
      renderPage(db);
      await screen.findByText('Joghurt');
      await userEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Joghurt' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Butter' }));
      await userEvent.click(within(pots()).getByRole('button', { name: 'Verarbeiten' }));
      const idOf = (name: string) => itemIdOf(db, name);
      expect(path()).toBe('/add/process');
      expect(search()).toBe(
        `?item=${String(await idOf('Joghurt'))}&item=${String(await idOf('Butter'))}`,
      );
    });
  });
});
