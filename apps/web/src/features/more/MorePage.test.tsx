import 'fake-indexeddb/auto';
import { cleanup, render, screen, within } from '@testing-library/react';
import { addDays } from '@fridgeai/core';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { browserClock } from '../../data/adapters';
import { testDb } from '../../data/test-helpers';
import { writeLastCheck } from '../check/check-state';
import { MorePage } from './MorePage';

function renderMore() {
  render(
    <AppDataProvider db={testDb()}>
      <MemoryRouter>
        <MorePage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

const row = () => screen.findByRole('link', { name: new RegExp(messages.pages.check) });

describe('«Mehr»: Kühlschrank-Check', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('is always there, opens the check and says «Noch nie» before the first one', async () => {
    renderMore();
    const link = await row();
    expect(link.getAttribute('href')).toBe('/check');
    expect(link.textContent).toContain('Noch nie');
  });

  it('says how long ago the last check was', async () => {
    writeLastCheck(addDays(browserClock.today(), -5));
    renderMore();
    expect((await row()).textContent).toContain('Zuletzt vor 5 Tagen');
  });

  it('puts Nachkaufen first, in three groups', async () => {
    renderMore();
    const daily = await screen.findByRole('region', { name: messages.more.groups.daily });
    expect(within(daily).getAllByRole('link')[0]?.getAttribute('href')).toBe('/shopping');
    const balance = screen.getByRole('region', { name: messages.more.groups.balance });
    expect(within(balance).getByRole('link', { name: /^Journal/ })).toBeDefined();
    const household = screen.getByRole('region', { name: messages.more.groups.household });
    expect(within(household).getAllByRole('link')).toHaveLength(2);
  });

  it('words today and yesterday', () => {
    expect(messages.more.checkDetail(0)).toBe('Zuletzt heute');
    expect(messages.more.checkDetail(1)).toBe('Zuletzt gestern');
  });
});
