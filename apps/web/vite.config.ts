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
      workbox: {
        // Precache fonts too, so the app looks the same offline. Skip unused subsets.
        globPatterns: ['**/*.{js,css,html,svg,woff2,webmanifest}'],
        globIgnores: ['**/*vietnamese*'],
      },
      manifest: {
        name: 'FridgeAI',
        short_name: 'FridgeAI',
        description: 'Wissen, was im Kühlschrank ist, und nichts mehr wegwerfen.',
        lang: 'de-CH',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#f8f6f1',
        background_color: '#f8f6f1',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
});
