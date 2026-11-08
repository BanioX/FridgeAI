import BaseAxeBuilder from '@axe-core/playwright';
import { test as base, type Page } from '@playwright/test';

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

/**
 * Axe as in every spec, but it first waits until all transitions and animations have ended.
 * Mid-fade, colours are a little lighter than at rest, and axe reported contrast errors that a
 * person never sees (L-19). Import it from here, never from `@axe-core/playwright` (lint rule).
 */
export class AxeBuilder extends BaseAxeBuilder {
  private readonly settlePage: Page;

  constructor(options: { page: Page }) {
    super(options);
    this.settlePage = options.page;
  }

  override async analyze(): ReturnType<BaseAxeBuilder['analyze']> {
    await this.settlePage.waitForFunction(() =>
      document.getAnimations().every((animation) => animation.playState !== 'running'),
    );
    return super.analyze();
  }
}
