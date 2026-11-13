import { expect, test, type Page } from '@playwright/test';

test.use({ hasTouch: true });

test.beforeEach(async ({ page }) => {
  // As if installed on the home screen: only there is the swipe back on (ADR-0091).
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query: string): MediaQueryList => {
      if (!query.includes('display-mode: standalone')) {
        return original(query);
      }
      // A real list from the browser, told that it matches.
      const standalone = original('(min-width: 0px)');
      Object.defineProperty(standalone, 'matches', { value: true });
      Object.defineProperty(standalone, 'media', { value: query });
      return standalone;
    };
  });
});

/** A finger from `fromX` to `toX` in a few steps, through Chromium's touch input. */
async function swipe(page: Page, fromX: number, toX: number) {
  const cdp = await page.context().newCDPSession(page);
  const y = 420;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: fromX, y }],
  });
  for (const step of [0.25, 0.5, 0.75, 1]) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: fromX + (toX - fromX) * step, y }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('a swipe from the left edge goes back one page', async ({ page }) => {
  await page.goto('/more');
  await page
    .getByRole('link', { name: /Auszüge/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Auszüge' })).toBeVisible();
  await swipe(page, 4, 300);
  await expect(page.getByRole('heading', { level: 1, name: 'Mehr' })).toBeVisible();
  // Rettich's own swipe, not the browser's: a horizontal swipe elsewhere can trigger Chromium's
  // own history gesture, so the middle of the screen and the tab roots are unit-tested instead.
  expect(await page.evaluate(() => document.documentElement.dataset.transition)).toBe('swipe');
});
