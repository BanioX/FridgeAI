import 'fake-indexeddb/auto';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { testDb } from '../data/test-helpers';
import { AppDataProvider } from './AppData';
import { messages } from './messages.de-CH';
import { routes } from './routes';

async function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppDataProvider db={testDb()}>
      <RouterProvider router={router} />
    </AppDataProvider>,
  );
  await screen.findByRole('navigation', { name: messages.navLabel });
}

describe('AppShell', () => {
  afterEach(cleanup);

  it('renders the Start page with five tabs, ＋ Erfassen in the middle', async () => {
    await renderAt('/');
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe(
      messages.pages.start,
    );
    const nav = screen.getByRole('navigation', { name: messages.navLabel });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      messages.nav.start,
      messages.nav.inventory,
      messages.nav.add,
      messages.nav.cook,
      messages.nav.more,
    ]);
    expect(
      within(nav).getByRole('link', { name: messages.nav.start }).getAttribute('aria-current'),
    ).toBe('page');
    expect(
      within(nav).getByRole('link', { name: messages.nav.more }).hasAttribute('aria-current'),
    ).toBe(false);
  });

  it('keeps «Mehr» highlighted on its subpages', async () => {
    await renderAt('/shopping');
    expect(
      await screen.findByRole('heading', { level: 1, name: messages.pages.shopping }),
    ).toBeDefined();
    const nav = screen.getByRole('navigation', { name: messages.navLabel });
    expect(
      within(nav).getByRole('link', { name: messages.nav.more }).getAttribute('aria-current'),
    ).toBe('page');
    expect(
      within(nav).getByRole('link', { name: messages.nav.start }).hasAttribute('aria-current'),
    ).toBe(false);
  });

  it('offers every way to add food under «Erfassen» and keeps the tab on the add form', async () => {
    await renderAt('/add');
    const main = within(await screen.findByRole('main'));
    expect(await main.findByRole('heading', { level: 1, name: messages.pages.add })).toBeDefined();
    for (const title of [
      messages.pages.receipt,
      messages.scanner.open,
      messages.addHub.manualTitle,
      messages.pages.ai,
    ]) {
      expect(main.getByRole('link', { name: new RegExp(`^${title}`) })).toBeDefined();
    }
    await userEvent.click(
      main.getByRole('link', { name: new RegExp(`^${messages.addHub.manualTitle}`) }),
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: messages.pages.addItem }),
    ).toBeDefined();
    const nav = screen.getByRole('navigation', { name: messages.navLabel });
    expect(
      within(nav).getByRole('link', { name: messages.nav.add }).getAttribute('aria-current'),
    ).toBe('page');
    expect(
      within(nav).getByRole('link', { name: messages.nav.inventory }).hasAttribute('aria-current'),
    ).toBe(false);
  });

  it('keeps «Kochen» highlighted on a recipe', async () => {
    await renderAt('/recipes/gibt-es-nicht');
    const nav = screen.getByRole('navigation', { name: messages.navLabel });
    expect(
      within(nav).getByRole('link', { name: messages.nav.cook }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('sends the old addresses to the new places', async () => {
    await renderAt('/scan');
    expect(
      await screen.findByRole('heading', { level: 1, name: messages.pages.add }),
    ).toBeDefined();
    cleanup();
    await renderAt('/household');
    expect(
      await screen.findByRole('heading', { level: 1, name: messages.pages.more }),
    ).toBeDefined();
  });

  it('navigates to Vorrat on click', async () => {
    await renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: messages.nav.inventory }));
    // Vorrat is a lazy route (#45): until its chunk is loaded, the old heading is still there.
    expect(
      await screen.findByRole('heading', { level: 1, name: messages.pages.inventory }),
    ).toBeDefined();
    expect(screen.getByRole('tablist')).toBeDefined();
  });

  it('opens Nachkaufen and the data from the «Mehr» menu', async () => {
    await renderAt('/more');
    expect(
      await screen.findByRole('heading', { level: 1, name: messages.pages.more }),
    ).toBeDefined();
    expect(screen.queryByText(/Schnittstelle/)).toBeNull();
    await userEvent.click(screen.getByRole('link', { name: new RegExp(messages.pages.data) }));
    expect(
      await screen.findByRole('heading', { level: 1, name: messages.pages.data }),
    ).toBeDefined();
    // The back link in the page, not the tab of the same name.
    await userEvent.click(
      within(screen.getByRole('main')).getByRole('link', { name: messages.pages.more }),
    );
    await userEvent.click(
      await screen.findByRole('link', { name: new RegExp(messages.pages.shopping) }),
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: messages.pages.shopping }),
    ).toBeDefined();
  });

  it('shows the not-found text for unknown paths', async () => {
    await renderAt('/gibt-es-nicht');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(messages.notFound.title);
    expect(screen.getByText(messages.notFound.text)).toBeDefined();
  });
});
