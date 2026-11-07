import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { CookPage } from './CookPage';

const t = messages.recipes;

function renderPage(db = testDb(), url = '/cook') {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={[url]}>
        <CookPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

const list = async () => within(await screen.findByRole('region', { name: t.listLabel }));
const isChecked = (name: string) => screen.getByRole<HTMLInputElement>('radio', { name }).checked;

describe('CookPage', () => {
  afterEach(cleanup);

  it('shows one list with «Retten» chosen and says so when nothing expires soon', async () => {
    renderPage();
    expect(await screen.findByText(t.empty.rescue)).toBeDefined();
    const values = screen.getAllByRole('radio').map((radio) => (radio as HTMLInputElement).value);
    expect(values).toEqual(['rescue', 'feierabend', 'all']);
    expect(isChecked(t.filters.rescue)).toBe(true);
    expect(screen.queryByText('Vegan')).toBeNull();
    expect(screen.queryByText('Alle Rezepte')).toBeNull();
  });

  it('ranks recipes that rescue expiring food under «Retten»', async () => {
    const db = testDb();
    await seedDb(db, [{ name: 'Vollmilch', location: 'fridge', inDays: 1 }]);
    renderPage(db);
    const first = (await (await list()).findAllByRole('link'))[0];
    expect(first?.textContent).toContain('Rettet Vollmilch');
    expect(first?.getAttribute('href')).toMatch(/^\/recipes\//);
  });

  it('lists the whole collection under «Alle» and starts there with ?filter=alle', async () => {
    renderPage(testDb(), '/cook?filter=alle');
    expect(await (await list()).findByRole('link', { name: /Bananen-Pancakes/ })).toBeDefined();
    expect(isChecked(t.filters.all)).toBe(true);
  });

  it('switches to «Feierabend» and explains an empty result', async () => {
    renderPage();
    await screen.findByText(t.empty.rescue);
    fireEvent.click(screen.getByRole('radio', { name: t.filters.feierabend }));
    expect(await screen.findByText(t.empty.feierabend)).toBeDefined();
    expect((await list()).queryAllByRole('link')).toHaveLength(0);
    expect(isChecked(t.filters.feierabend)).toBe(true);
  });

  it('falls back to «Retten» for an unknown filter', async () => {
    renderPage(testDb(), '/cook?filter=vegan');
    expect(await screen.findByText(t.empty.rescue)).toBeDefined();
  });
});
