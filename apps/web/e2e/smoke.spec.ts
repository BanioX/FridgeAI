import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('shell renders, navigates and has no a11y violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Heute retten' })).toBeVisible();
  await expect(page.locator('head link[rel="manifest"]')).toHaveCount(1);

  const home = await new AxeBuilder({ page }).analyze();
  expect(home.violations).toEqual([]);

  await page.getByRole('navigation').getByRole('link', { name: 'Vorrat' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByRole('tablist')).toBeVisible();

  const inventory = await new AxeBuilder({ page }).analyze();
  expect(inventory.violations).toEqual([]);
});
