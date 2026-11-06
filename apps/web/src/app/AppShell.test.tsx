import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { messages } from './messages.de-CH';
import { routes } from './routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
}

describe('AppShell', () => {
  afterEach(cleanup);

  it('renders the Heute page with a five-link navigation', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(messages.pages.today);
    const nav = screen.getByRole('navigation', { name: messages.navLabel });
    expect(within(nav).getAllByRole('link')).toHaveLength(5);
    expect(
      within(nav).getByRole('link', { name: messages.nav.today }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('navigates to Vorrat on click', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: messages.nav.inventory }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(messages.pages.inventory);
  });

  it('shows the contract version on the Haushalt page', () => {
    renderAt('/household');
    expect(screen.getByText(`${messages.contractVersion} v1`)).toBeDefined();
  });

  it('shows the not-found text for unknown paths', () => {
    renderAt('/gibt-es-nicht');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(messages.notFound.title);
    expect(screen.getByText(messages.notFound.text)).toBeDefined();
  });
});
