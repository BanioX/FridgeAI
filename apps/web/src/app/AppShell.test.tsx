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

  it('renders the Heute page with a five-link navigation', async () => {
    await renderAt('/');
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe(
      messages.pages.today,
    );
    const nav = screen.getByRole('navigation', { name: messages.navLabel });
    expect(within(nav).getAllByRole('link')).toHaveLength(5);
    expect(
      within(nav).getByRole('link', { name: messages.nav.today }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('navigates to Vorrat on click', async () => {
    await renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: messages.nav.inventory }));
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe(
      messages.pages.inventory,
    );
    expect(screen.getByRole('tablist')).toBeDefined();
  });

  it('shows the contract version on the Haushalt page', async () => {
    await renderAt('/household');
    expect(screen.getByText(`${messages.contractVersion} v1`)).toBeDefined();
  });

  it('shows the not-found text for unknown paths', async () => {
    await renderAt('/gibt-es-nicht');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(messages.notFound.title);
    expect(screen.getByText(messages.notFound.text)).toBeDefined();
  });
});
