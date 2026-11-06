import { CONTRACT_VERSION } from '@fridgeai/core';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { PlaceholderPage } from '../features/placeholder/PlaceholderPage';
import { TodayPage } from '../features/today/TodayPage';
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
      // The start page loads with the app; every other page is its own chunk, fetched on first
      // visit and precached by the service worker for offline use.
      { index: true, element: <TodayPage /> },
      {
        path: 'inventory',
        lazy: async () => ({
          Component: (await import('../features/inventory/InventoryPage')).InventoryPage,
        }),
      },
      {
        path: 'inventory/new',
        lazy: async () => ({
          Component: (await import('../features/inventory/AddItemPage')).AddItemPage,
        }),
      },
      {
        path: 'inventory/:itemId',
        lazy: async () => ({
          Component: (await import('../features/inventory/ItemDetailPage')).ItemDetailPage,
        }),
      },
      {
        path: 'scan',
        lazy: async () => ({
          Component: (await import('../features/import/AiImportPage')).AiImportPage,
        }),
      },
      { path: 'shopping', element: <PlaceholderPage title={messages.pages.shopping} /> },
      { path: 'household', element: <HouseholdPage /> },
      // Demo data and design-system reference: dev and demo builds only (dead code in production).
      // Inline on purpose: the bundler drops the lazy chunks only for a literal condition here.
      ...(import.meta.env.DEV || import.meta.env.MODE === 'demo'
        ? [
            {
              path: 'dev/seed',
              lazy: async () => ({
                Component: (await import('../features/dev/DemoSeedPage')).DemoSeedPage,
              }),
            },
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
