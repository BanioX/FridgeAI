import { createBrowserRouter, Navigate, useParams, type RouteObject } from 'react-router';
import { PlaceholderPage } from '../features/placeholder/PlaceholderPage';
import { TodayPage } from '../features/today/TodayPage';
import { AppShell } from './AppShell';
import { RouteError } from './RouteError';
import { messages } from './messages.de-CH';

/** An old link `/recipes/<id>` opens the same recipe under «Wissen». */
function RecipeRedirect() {
  const { recipeId = '' } = useParams();
  return <Navigate to={`/knowledge/recipes/${encodeURIComponent(recipeId)}`} replace />;
}

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
        path: 'inventory/put-away',
        lazy: async () => ({
          Component: (await import('../features/inventory/PutAwayPage')).PutAwayPage,
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
        path: 'add/photo',
        lazy: async () => ({
          Component: (await import('../features/photo/PhotoPage')).PhotoPage,
        }),
      },
      {
        path: 'add/process',
        lazy: async () => ({
          Component: (await import('../features/process/ProcessPage')).ProcessPage,
        }),
      },
      {
        path: 'check',
        lazy: async () => ({
          Component: (await import('../features/check/CheckPage')).CheckPage,
        }),
      },
      {
        path: 'knowledge',
        lazy: async () => ({
          Component: (await import('../features/knowledge/KnowledgePage')).KnowledgePage,
        }),
      },
      {
        path: 'knowledge/recipes',
        lazy: async () => ({
          Component: (await import('../features/recipes/RecipeListPage')).RecipeListPage,
        }),
      },
      {
        path: 'knowledge/recipes/new',
        lazy: async () => ({
          Component: (await import('../features/recipes/RecipeFormPage')).RecipeFormPage,
        }),
      },
      {
        path: 'knowledge/recipes/:recipeId/edit',
        lazy: async () => ({
          Component: (await import('../features/recipes/RecipeFormPage')).RecipeFormPage,
        }),
      },
      {
        path: 'knowledge/recipes/:recipeId',
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
        path: 'more/reports/view',
        lazy: async () => ({
          Component: (await import('../features/reports/ReportViewPage')).ReportViewPage,
        }),
      },
      {
        path: 'more/climate',
        lazy: async () => ({
          Component: (await import('../features/climate/ClimatePage')).ClimatePage,
        }),
      },
      {
        path: 'more/history',
        lazy: async () => ({
          Component: (await import('../features/history/HistoryPage')).HistoryPage,
        }),
      },
      {
        path: 'more/achievements',
        lazy: async () => ({
          Component: (await import('../features/achievements/AchievementsPage')).AchievementsPage,
        }),
      },
      {
        path: 'more/vacation',
        lazy: async () => ({
          Component: (await import('../features/vacation/VacationPage')).VacationPage,
        }),
      },
      {
        path: 'more/spots',
        lazy: async () => ({
          Component: (await import('../features/spots/SpotsPage')).SpotsPage,
        }),
      },
      {
        path: 'more/spots/:spotId',
        lazy: async () => ({
          Component: (await import('../features/spots/SpotDetailPage')).SpotDetailPage,
        }),
      },
      {
        path: 'more/people',
        lazy: async () => ({
          Component: (await import('../features/people/PeoplePage')).PeoplePage,
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
      // «Mit eigener KI» was removed on 7.11.2026 (ADR-0012): old links land on «Erfassen».
      { path: 'add/ai', element: <Navigate to="/add" replace /> },
      { path: 'household', element: <Navigate to="/more" replace /> },
      // Recipes live under «Wissen» (ADR-0048): old links to a recipe follow; the old tab «Kochen»
      // lands on Start.
      { path: 'cook', element: <Navigate to="/" replace /> },
      { path: 'recipes', element: <Navigate to="/knowledge/recipes" replace /> },
      { path: 'recipes/:recipeId', element: <RecipeRedirect /> },
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
