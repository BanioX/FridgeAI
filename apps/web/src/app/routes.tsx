import { CONTRACT_VERSION } from '@fridgeai/core';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { PlaceholderPage } from '../features/placeholder/PlaceholderPage';
import { AppShell } from './AppShell';
import { messages } from './messages.de-CH';

function HouseholdPage() {
  return (
    <PlaceholderPage title={messages.pages.household}>
      <p className="mt-4 text-sm text-neutral-600">
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
