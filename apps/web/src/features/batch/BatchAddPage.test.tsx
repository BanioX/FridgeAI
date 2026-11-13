import 'fake-indexeddb/auto';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider, useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { testDb } from '../../data/test-helpers';
import { BatchAddPage } from './BatchAddPage';

const t = messages.batchAdd;

function Where() {
  const { pathname, search } = useLocation();
  return <output data-testid="where">{pathname + search}</output>;
}

const probe: { list: () => Promise<{ name: string }[]> } = { list: () => Promise.resolve([]) };
function Probe() {
  const { householdId, inventory } = useAppData();
  useEffect(() => {
    probe.list = async () => (await inventory['inventory.list']({ householdId })).items;
  }, [householdId, inventory]);
  return null;
}

function renderPage() {
  render(
    <AppDataProvider db={testDb()}>
      <MemoryRouter initialEntries={['/add/batch']}>
        <Probe />
        <Routes>
          <Route path="/add/batch" element={<BatchAddPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
}

describe('BatchAddPage', () => {
  afterEach(cleanup);

  it('keeps the button off while the text is empty', async () => {
    renderPage();
    const button = await screen.findByRole('button', { name: /Artikel in den Vorrat/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('previews rows, removes one and adds the rest', async () => {
    renderPage();
    await userEvent.type(await screen.findByLabelText(t.what), '3 Äpfel, Salat, Milch');
    expect(await screen.findAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('button', { name: t.submit(3) })).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: t.removeNamed('Salat') }));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: t.removeNamed('Salat') })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: t.submit(2) }));
    await waitFor(() => {
      expect(screen.getByTestId('where').textContent).toMatch(
        /^\/inventory\/put-away\?item=.+&item=.+/,
      );
    });
    expect((await probe.list()).map((item) => item.name).sort()).toEqual(['Milch', 'Äpfel']);
  });
});
