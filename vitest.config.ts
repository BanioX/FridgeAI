import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**', 'apps/*/src/**'],
      exclude: ['**/*.d.ts', '**/main.tsx'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        'packages/core/src/**': { lines: 90, functions: 90, branches: 85, statements: 90 },
      },
    },
  },
});
