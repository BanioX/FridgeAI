import type { Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

async function expectNoOverflow(page: Page) {
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
}

test('minimum stock: settling the last pack puts a staple on «Nachkaufen» by itself', async ({
  page,
}) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Vollmilch');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Vollmilch/ }).click();

  // «Immer da haben»: 1.
  const group = page.getByRole('group', { name: 'Immer da haben' });
  await expect(group).toBeVisible();
  await group.locator('label').filter({ hasText: /^1$/ }).click();
  await expect(group.getByRole('radio', { name: '1', exact: true })).toBeChecked();
  await expect(
    page.getByText('Fällt der Vorrat darunter, kommt es auf «Nachkaufen».'),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expectNoOverflow(page);

  // Settle the only pack as verwertet; the Vorrat page says it is on the list now.
  await page.getByRole('button', { name: 'Als verwertet speichern' }).click();
  await expect(page.getByRole('status').first()).toHaveText(
    'Vollmilch: als verwertet gespeichert.',
  );
  await expect(page.getByText('Steht jetzt auf «Nachkaufen».')).toBeVisible();

  await page.goto('/shopping');
  await expect(page.getByRole('checkbox', { name: /Vollmilch/ })).toBeVisible();
  await expect(page.getByText('Mindestbestand', { exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expectNoOverflow(page);
});
