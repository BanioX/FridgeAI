import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

/**
 * Every test: Open Food Facts is never called for real. The name search (ADR-0025) asks while
 * typing, so each test starts with an empty search answer; a spec's own `page.route` wins.
 */
export const test = base.extend<{ noOpenFoodFacts: undefined }>({
  noOpenFoodFacts: [
    async ({ context }, provide) => {
      await context.route('https://*.openfoodfacts.org/**', (route) =>
        route.request().url().includes('/cgi/search.pl')
          ? route.fulfill({ json: { count: 0, products: [] } })
          : route.abort(),
      );
      await provide(undefined);
    },
    { auto: true },
  ],
});
