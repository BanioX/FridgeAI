import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AppDataProvider } from './app/AppData';
import { createAppRouter } from './app/routes';
import '@fontsource-variable/figtree';
import '@fontsource-variable/fraunces/opsz.css';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <StrictMode>
    <AppDataProvider>
      <RouterProvider router={createAppRouter()} />
    </AppDataProvider>
  </StrictMode>,
);
