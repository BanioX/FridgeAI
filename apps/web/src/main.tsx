import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AppDataProvider } from './app/AppData';
import { AppLockGate, AppLockProvider } from './app/lock/AppLock';
import { createAppRouter } from './app/routes';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <StrictMode>
    <AppLockProvider>
      <AppLockGate>
        <AppDataProvider>
          <RouterProvider router={createAppRouter()} />
        </AppDataProvider>
      </AppLockGate>
    </AppLockProvider>
  </StrictMode>,
);
