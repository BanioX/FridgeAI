import 'fake-indexeddb/auto';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { testDb } from '../../data/test-helpers';
import { PeoplePage } from './PeoplePage';

const t = messages.people;

async function renderPage() {
  const db = testDb();
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>
        <PeoplePage />
      </MemoryRouter>
    </AppDataProvider>,
  );
  await screen.findByRole('heading', { level: 1, name: messages.pages.people });
  await screen.findByText(new RegExp(messages.defaults.memberName));
  return db;
}

async function addPerson(name: string) {
  await userEvent.type(screen.getByLabelText(t.name), name);
  await userEvent.click(screen.getByRole('button', { name: t.add }));
  await screen.findByText(t.added(name));
}

const list = () => within(screen.getByRole('region', { name: t.listLabel }));

describe('PeoplePage', () => {
  afterEach(cleanup);

  it('says how it works and that Rettich runs on one device for now', async () => {
    await renderPage();
    expect(screen.getByText(t.intro)).toBeDefined();
    expect(screen.getByText(t.deviceNote)).toBeDefined();
  });

  it('marks you and cannot remove you', async () => {
    await renderPage();
    const me = list().getByRole('button', { name: /\(du\)/ });
    expect(me.textContent).toContain(messages.defaults.memberName);
    await userEvent.click(me);
    expect(screen.queryByRole('button', { name: t.remove })).toBeNull();
  });

  it('adds a person with initials', async () => {
    await renderPage();
    await addPerson('Mia');
    expect(list().getAllByRole('listitem')).toHaveLength(2);
    expect(list().getByRole('button', { name: t.edit('Mia') }).textContent).toContain('Mia');
  });

  it('asks for a name and refuses a name that exists', async () => {
    await renderPage();
    await userEvent.click(screen.getByRole('button', { name: t.add }));
    expect((await screen.findByRole('alert')).textContent).toBe(t.nameMissing);
    await addPerson('Mia');
    await userEvent.type(screen.getByLabelText(t.name), 'mia');
    await userEvent.click(screen.getByRole('button', { name: t.add }));
    expect((await screen.findByRole('alert')).textContent).toBe(t.nameTaken);
  });

  it('renames a person by tapping them', async () => {
    await renderPage();
    await addPerson('Mia');
    await userEvent.click(list().getByRole('button', { name: t.edit('Mia') }));
    const field = screen.getByLabelText(t.rename);
    await userEvent.clear(field);
    await userEvent.type(field, 'Mia Muster');
    await userEvent.click(screen.getByRole('button', { name: t.save }));
    expect(await screen.findByText(t.renamed('Mia Muster'))).toBeDefined();
    expect(list().getByRole('button', { name: t.edit('Mia Muster') })).toBeDefined();
  });

  it('removes a person only after a confirm step that says what happens to their things', async () => {
    await renderPage();
    await addPerson('Mia');
    await userEvent.click(list().getByRole('button', { name: t.edit('Mia') }));
    await userEvent.click(screen.getByRole('button', { name: t.remove }));
    expect(screen.getByText(t.removeQuestion('Mia'))).toBeDefined();
    expect(list().getAllByRole('listitem')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: t.removeConfirm }));
    expect(await screen.findByText(t.removed('Mia'))).toBeDefined();
    expect(list().getAllByRole('listitem')).toHaveLength(1);
  });
});
