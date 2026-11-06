import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'FridgeAI',
        short_name: 'FridgeAI',
        description: 'Wissen, was im Kühlschrank ist, und nichts mehr wegwerfen.',
        lang: 'de-CH',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#15803d',
        background_color: '#ffffff',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
});
