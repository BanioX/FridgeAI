import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { VacationPage } from './VacationPage';

const t = messages.vacation;

async function renderPage(items: Parameters<typeof seedDb>[1]) {
  const db = testDb();
  await seedDb(db, items);
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>
        <VacationPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
  return db;
}

describe('VacationPage', () => {
  afterEach(cleanup);

  it('lists what runs out before the return in the right group', async () => {
    await renderPage([
      { name: 'Hackfleisch', categoryId: 'meat-minced', location: 'fridge', inDays: 3 },
      { name: 'Kopfsalat', categoryId: 'produce-salad', location: 'fridge', inDays: 4 },
      { name: 'Vollmilch', categoryId: 'dairy-milk', location: 'fridge', inDays: 30 },
      { name: 'Erbsen', categoryId: 'meat-minced', location: 'freezer', inDays: 2 },
    ]);
    const freezeGroup = await screen.findByRole('region', { name: t.freezeTitle(1) });
    expect(within(freezeGroup).getByText('Hackfleisch')).toBeDefined();
    const useUpGroup = screen.getByRole('region', { name: t.useUpTitle(1) });
    expect(within(useUpGroup).getByText('Kopfsalat')).toBeDefined();
    expect(screen.queryByText('Vollmilch')).toBeNull();
    expect(screen.queryByText('Erbsen')).toBeNull();
  });

  it('freezes an item with one tap and it leaves the list', async () => {
    const db = await renderPage([
      { name: 'Hackfleisch', categoryId: 'meat-minced', location: 'fridge', inDays: 3 },
    ]);
    fireEvent.click(await screen.findByRole('button', { name: t.freezeOne('Hackfleisch') }));
    await waitFor(() => {
      expect(screen.queryByText('Hackfleisch')).toBeNull();
    });
    expect((await db.items.toArray())[0]?.location).toBe('freezer');
    expect(screen.getByText(t.nothing)).toBeDefined();
  });

  it('freezes everything in the group with «Alle einfrieren»', async () => {
    const db = await renderPage([
      { name: 'Hackfleisch', categoryId: 'meat-minced', location: 'fridge', inDays: 3 },
      { name: 'Hackfleisch II', categoryId: 'meat-minced', location: 'fridge', inDays: 2 },
    ]);
    fireEvent.click(await screen.findByRole('button', { name: t.freezeAll }));
    await waitFor(async () => {
      expect((await db.items.toArray()).every((item) => item.location === 'freezer')).toBe(true);
    });
  });

  it('says so when nothing runs out', async () => {
    await renderPage([
      { name: 'Reis', categoryId: 'pantry-rice', location: 'pantry', inDays: 300 },
    ]);
    expect(await screen.findByText(t.nothing)).toBeDefined();
  });

  it('says so when nothing is in stock', async () => {
    await renderPage([]);
    expect(await screen.findByText(t.noStock)).toBeDefined();
  });

  it('warns when the return day lies before the departure', async () => {
    await renderPage([
      { name: 'Hackfleisch', categoryId: 'meat-minced', location: 'fridge', inDays: 3 },
    ]);
    await screen.findByText('Hackfleisch');
    const back = screen.getByLabelText(t.back);
    fireEvent.change(back, { target: { value: '01.01.2020' } });
    expect((await screen.findByRole('alert')).textContent).toBe(t.badOrder);
  });
});
