import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PW_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: 'e2e',
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'off',
    // Taps during a page transition do not reach the page (ADR-0088), so the specs run with
    // «Bewegung reduzieren»; e2e/page-transitions.spec.ts covers the motion itself.
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // The full Chromium in new headless mode, locally and in CI: the stripped-down headless
        // shell handles camera permissions differently from a real browser (barcode E2E).
        ...(executablePath ? { launchOptions: { executablePath } } : { channel: 'chromium' }),
      },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
