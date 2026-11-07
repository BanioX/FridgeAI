import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { ocrLanguage } from './scripts/ocr-language.ts';
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
    ocrLanguage(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Precache fonts, the barcode reader (wasm) and the PDF reader (mjs worker) too, so the app
        // works offline.
        // Skip unused font subsets.
        globPatterns: ['**/*.{js,mjs,css,html,svg,woff2,webmanifest,wasm}'],
        globIgnores: ['**/*vietnamese*', '**/tesseract-core*'],
        // The photo reader (about 4 MB) is cached on first use, not at install (ADR-0028).
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/tesseract-core'),
            handler: 'CacheFirst',
            options: { cacheName: 'ocr-engine', expiration: { maxEntries: 2 } },
          },
        ],
      },
      manifest: {
        name: 'Rettich',
        short_name: 'Rettich',
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
