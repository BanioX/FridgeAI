import 'fake-indexeddb/auto';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { testDb } from '../../data/test-helpers';
import { KnowledgePage } from './KnowledgePage';

const t = messages.knowledge;

describe('KnowledgePage «Rettich im Alltag»', () => {
  afterEach(cleanup);

  async function openGroup(): Promise<HTMLElement> {
    render(
      <AppDataProvider db={testDb()}>
        <MemoryRouter>
          <KnowledgePage />
        </MemoryRouter>
      </AppDataProvider>,
    );
    const heading = await screen.findByRole('heading', { level: 2, name: t.everydayTitle });
    const section = heading.closest('section');
    if (section === null) throw new Error('the group has no section');
    return section;
  }

  it('renders the group with a collapsible entry for every everyday feature', async () => {
    const section = await openGroup();
    for (const { title } of t.everyday) {
      expect(within(section).getByText(title)).toBeTruthy();
    }
    expect(section.querySelectorAll('details')).toHaveLength(t.everyday.length);
    expect(t.everyday.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        'Klimabilanz',
        'Datum fotografieren',
        'Sicherung',
        'Was von der Packung übrig ist',
      ]),
    );
  });

  it('opens an entry on a tap on its native summary and shows its text', async () => {
    const section = await openGroup();
    const [entry] = t.everyday;
    const summary = within(section).getByText(entry.title).closest('summary');
    if (summary === null) throw new Error('no summary');
    await userEvent.setup().click(summary);
    expect(summary.closest('details')?.open).toBe(true);
    expect(within(section).getByText(entry.text)).toBeTruthy();
  });

  it('shows the info mark of «Im Blick» as the circled sign, not as «(i)» (Alban, 13.11.2026)', async () => {
    const section = await openGroup();
    const summary = within(section).getByText('Im Blick').closest('summary');
    if (summary === null) throw new Error('no summary');
    await userEvent.setup().click(summary);
    const details = summary.closest('details');
    if (details === null) throw new Error('no details');
    expect(within(details).getAllByRole('img', { name: messages.attention.mark })).toHaveLength(2);
    expect(details.textContent).not.toMatch(/\(i\)|\{i\}/);
  });

  it('writes no info mark as «(i)» in any text of the app', () => {
    expect(JSON.stringify(messages)).not.toContain('(i)');
  });

  it('says in the privacy note that date photos are read on the device and not stored', () => {
    expect(messages.household.privacyPoints.join(' ')).toMatch(/Datumsangaben.*nie gespeichert/);
  });
});
