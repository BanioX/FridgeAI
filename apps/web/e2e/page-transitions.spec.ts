import { expect, test, type Page } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

/** The kind of the last page transition, and a wait until its animation is over. */
async function settled(page: Page): Promise<string | undefined> {
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
  return page.evaluate(() => document.documentElement.dataset.transition);
}

test('pages push in, go back and cross-fade between tabs like on the iPhone', async ({ page }) => {
  await page.goto('/more');
  await page
    .getByRole('link', { name: /Auszüge/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Auszüge' })).toBeVisible();
  expect(await settled(page)).toBe('forward');
  // Once the page stands still, a tap lands as usual.
  const full = page.getByRole('radio', { name: 'Gesamtauszug' });
  await full.check({ force: true });
  await expect(full).toBeChecked();

  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Mehr' })).toBeVisible();
  expect(await settled(page)).toBe('back');

  await page.getByRole('navigation', { name: /./ }).getByRole('link', { name: 'Vorrat' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  expect(await settled(page)).toBe('tab');
});

test('«Bewegung reduzieren» keeps every page change still', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/more');
  await page
    .getByRole('link', { name: /Auszüge/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Auszüge' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.transition)).toBeUndefined();
  await context.close();
});
