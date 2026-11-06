import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { staticHeaders } from './scripts/static-headers.ts';

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        // Libraries change rarely, the app often: separate chunks stay cached across releases.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler|cookie-es|@remix-run)[\\/]/,
            },
            { name: 'data', test: /node_modules[\\/](dexie|dexie-react-hooks|zod)[\\/]/ },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    staticHeaders(new URL('public/_headers', import.meta.url)),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Precache fonts and the barcode reader (wasm) too, so the app works offline.
        // Skip unused font subsets.
        globPatterns: ['**/*.{js,css,html,svg,woff2,webmanifest,wasm}'],
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
        // PNGs from scripts/icons.ts: Android needs 192 and 512 px to offer «install».
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
