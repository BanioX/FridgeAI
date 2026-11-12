import { AxeBuilder, expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

/**
 * Zutat oder Fertigprodukt (ADR-0053): a Skyr Cheesecake is a dessert, so it carries the badge
 * and never stands in for the Joghurt of a Birchermüesli.
 */
test('a Skyr Cheesecake is a Fertigprodukt and does not count as Joghurt for Birchermüesli', async ({
  page,
}) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Skyr Cheesecake');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();

  await page.getByRole('link', { name: /Skyr Cheesecake/ }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Fertigprodukt' })).toBeVisible();
  const kind = page.getByRole('group', { name: 'Art des Artikels' });
  await expect(kind.getByRole('radio', { name: 'Fertigprodukt' })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto('/knowledge/recipes/birchermuesli');
  await expect(page.getByRole('heading', { level: 1, name: 'Birchermüesli' })).toBeVisible();
  const missing = page.getByRole('heading', { level: 3, name: 'Fehlt', exact: true });
  await expect(missing).toBeVisible();
  await expect(page.getByText(/Milch oder Joghurt/)).toBeVisible();
  await expect(page.getByText(/^Da: Skyr Cheesecake/)).toHaveCount(0);
});
