import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { ProcessPage } from './ProcessPage';

const t = messages.process;

function Landing() {
  const { state } = useLocation() as { state: { closed?: { name: string } } | null };
  return <p>Vorrat {state?.closed?.name ?? ''}</p>;
}

async function renderProcess(
  entry: string | { pathname: string; state: unknown },
  items: Parameters<typeof seedDb>[1],
) {
  const db = testDb();
  await seedDb(db, items);
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/add/process" element={<ProcessPage />} />
          <Route path="/inventory" element={<Landing />} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
  return db;
}

describe('ProcessPage', () => {
  afterEach(cleanup);

  it('bakes a cake from chosen ingredients and lands in the Vorrat', async () => {
    const db = await renderProcess('/add/process', [
      { name: 'Mehl', location: 'pantry', priceRappen: 150 },
      { name: 'Eier', location: 'fridge', priceRappen: 400 },
    ]);
    fireEvent.click(await screen.findByRole('button', { name: /Mehl/ }));
    fireEvent.click(screen.getByRole('button', { name: /Eier/ }));
    expect(screen.getByText(t.chosen(2))).toBeDefined();
    fireEvent.change(screen.getByLabelText(t.name), { target: { value: 'Schokoladenkuchen' } });
    fireEvent.click(screen.getByRole('button', { name: t.save }));
    await screen.findByText('Vorrat Schokoladenkuchen');

    const items = await db.items.toArray();
    const cake = items.find((item) => item.origin === 'made');
    expect(cake).toMatchObject({ location: 'fridge', priceRappen: 550, status: 'active' });
    expect(items.filter((item) => item.status === 'eaten')).toHaveLength(2);
  });

  it('asks for a name and for ingredients before saving', async () => {
    await renderProcess('/add/process', [{ name: 'Mehl', location: 'pantry' }]);
    fireEvent.click(await screen.findByRole('button', { name: t.save }));
    expect(await screen.findByText(t.needName)).toBeDefined();
    fireEvent.change(screen.getByLabelText(t.name), { target: { value: 'Brot' } });
    fireEvent.click(screen.getByRole('button', { name: t.save }));
    expect(await screen.findByText(t.needIngredients)).toBeDefined();
  });

  it('records leftovers from nothing with a name only', async () => {
    const db = await renderProcess('/add/process?kind=leftover', []);
    expect(await screen.findByText(t.nothingAtHome)).toBeDefined();
    fireEvent.change(screen.getByLabelText(t.name), { target: { value: 'Reste: Lasagne' } });
    fireEvent.click(screen.getByRole('button', { name: t.save }));
    await screen.findByText('Vorrat Reste: Lasagne');
    expect(await db.items.toArray()).toMatchObject([{ origin: 'leftover', location: 'fridge' }]);
  });

  it('preselects the item of the link', async () => {
    await renderProcess('/add/process?item=none', [{ name: 'Mehl', location: 'pantry' }]);
    expect(await screen.findByText(t.chosen(0))).toBeDefined();
  });

  it('cooks a recipe: prefilled ingredients, nothing left over', async () => {
    const db = testDb();
    await seedDb(db, [
      { name: 'Reis', location: 'pantry' },
      { name: 'Zwiebel', location: 'pantry' },
    ]);
    const stored = await db.items.toArray();
    const reis = stored.find((item) => item.status === 'active');
    render(
      <AppDataProvider db={db}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/add/process',
              state: {
                process: { recipeId: 'risotto', title: 'Risotto', itemIds: [reis?.id] },
              },
            },
          ]}
        >
          <Routes>
            <Route path="/add/process" element={<ProcessPage />} />
            <Route path="/inventory" element={<Landing />} />
          </Routes>
        </MemoryRouter>
      </AppDataProvider>,
    );
    expect(await screen.findByText(t.chosen(1))).toBeDefined();
    // «Reste in den Kühlschrank?» defaults to no.
    expect(screen.getByRole('radio', { name: t.no })).toHaveProperty('checked', true);
    expect(screen.queryByLabelText(t.name)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: t.save }));
    await waitFor(async () => {
      expect((await db.items.toArray()).filter((item) => item.status === 'eaten')).toHaveLength(1);
    });
    const events = await db.events.toArray();
    expect(events.find((event) => event.type === 'item.processed')?.payload).toMatchObject({
      kind: 'cooked',
      recipeId: 'risotto',
    });
  });

  it('cooks a recipe with leftovers: the title becomes «Reste: …»', async () => {
    const db = testDb();
    await seedDb(db, [{ name: 'Reis', location: 'pantry' }]);
    const reis = (await db.items.toArray())[0];
    render(
      <AppDataProvider db={db}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/add/process',
              state: { process: { recipeId: 'risotto', title: 'Risotto', itemIds: [reis?.id] } },
            },
          ]}
        >
          <Routes>
            <Route path="/add/process" element={<ProcessPage />} />
            <Route path="/inventory" element={<Landing />} />
          </Routes>
        </MemoryRouter>
      </AppDataProvider>,
    );
    fireEvent.click(await screen.findByRole('radio', { name: t.yes }));
    expect((screen.getByLabelText(t.name) as HTMLInputElement).value).toBe('Reste: Risotto');
    fireEvent.click(screen.getByRole('button', { name: t.save }));
    await screen.findByText('Vorrat Reste: Risotto');
    expect((await db.items.toArray()).find((item) => item.origin === 'leftover')).toBeDefined();
  });
});
