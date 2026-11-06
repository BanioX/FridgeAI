import { CONTRACT_VERSION } from '@fridgeai/core';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { PlaceholderPage } from '../features/placeholder/PlaceholderPage';
import { AppShell } from './AppShell';
import { messages } from './messages.de-CH';

function HouseholdPage() {
  return (
    <PlaceholderPage title={messages.pages.household}>
      <p className="mt-3 text-sm text-ink-muted">
        {messages.contractVersion} {CONTRACT_VERSION}
      </p>
    </PlaceholderPage>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <PlaceholderPage title={messages.pages.today} /> },
      { path: 'inventory', element: <PlaceholderPage title={messages.pages.inventory} /> },
      { path: 'scan', element: <PlaceholderPage title={messages.pages.scan} /> },
      { path: 'shopping', element: <PlaceholderPage title={messages.pages.shopping} /> },
      { path: 'household', element: <HouseholdPage /> },
      // Design-system reference, only in development builds (dead code in production).
      ...(import.meta.env.DEV
        ? [
            {
              path: 'styleguide',
              lazy: async () => ({
                Component: (await import('../features/styleguide/StyleguidePage')).StyleguidePage,
              }),
            },
          ]
        : []),
      {
        path: '*',
        element: <PlaceholderPage title={messages.notFound.title} text={messages.notFound.text} />,
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
