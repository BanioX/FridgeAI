import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { PlaceholderPage } from '../features/placeholder/PlaceholderPage';
import { TodayPage } from '../features/today/TodayPage';
import { AppShell } from './AppShell';
import { RouteError } from './RouteError';
import { messages } from './messages.de-CH';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
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
        path: 'inventory/:itemId/edit',
        lazy: async () => ({
          Component: (await import('../features/inventory/EditItemPage')).EditItemPage,
        }),
      },
      {
        path: 'inventory/:itemId',
        lazy: async () => ({
          Component: (await import('../features/inventory/ItemDetailPage')).ItemDetailPage,
        }),
      },
      {
        path: 'add',
        lazy: async () => ({
          Component: (await import('../features/import/AddPage')).AddPage,
        }),
      },
      {
        path: 'add/receipt',
        lazy: async () => ({
          Component: (await import('../features/receipts/ReceiptPage')).ReceiptPage,
        }),
      },
      {
        path: 'add/ai',
        lazy: async () => ({
          Component: (await import('../features/import/AiImportPage')).AiImportPage,
        }),
      },
      {
        path: 'check',
        lazy: async () => ({
          Component: (await import('../features/check/CheckPage')).CheckPage,
        }),
      },
      {
        path: 'cook',
        lazy: async () => ({
          Component: (await import('../features/recipes/CookPage')).CookPage,
        }),
      },
      {
        path: 'recipes/:recipeId',
        lazy: async () => ({
          Component: (await import('../features/recipes/RecipePage')).RecipePage,
        }),
      },
      {
        path: 'shopping',
        lazy: async () => ({
          Component: (await import('../features/shopping/ShoppingPage')).ShoppingPage,
        }),
      },
      {
        path: 'more',
        lazy: async () => ({
          Component: (await import('../features/more/MorePage')).MorePage,
        }),
      },
      {
        path: 'more/reports',
        lazy: async () => ({
          Component: (await import('../features/reports/ReportsPage')).ReportsPage,
        }),
      },
      {
        path: 'more/history',
        lazy: async () => ({
          Component: (await import('../features/history/HistoryPage')).HistoryPage,
        }),
      },
      {
        path: 'more/data',
        lazy: async () => ({
          Component: (await import('../features/household/HouseholdPage')).HouseholdPage,
        }),
      },
      // Addresses before the four tabs (ADR-0031): bookmarks and installed apps keep working.
      { path: 'scan', element: <Navigate to="/add" replace /> },
      { path: 'household', element: <Navigate to="/more" replace /> },
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
