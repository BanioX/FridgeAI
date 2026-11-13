import { AxeBuilder, expect, test } from './test';

// Dunkelmodus (ADR-0081): the app follows the device, and every screen keeps WCAG AA at night.
test.use({ colorScheme: 'dark' });

test('dark mode: the main screens pass the accessibility check, contrast included', async ({
  page,
}) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Vollmilch');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('link', { name: /Vollmilch/ })).toBeVisible();

  // The ground really is dark.
  const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(ground).toBe('rgb(11, 12, 14)');

  for (const path of ['/', '/inventory', '/add', '/more', '/more/history', '/knowledge']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }

  await page.goto('/inventory');
  await page.getByRole('link', { name: /Vollmilch/ }).click();
  await page.getByRole('radio', { name: 'Entsorgt' }).check({ force: true });
  const item = await new AxeBuilder({ page }).analyze();
  expect(item.violations).toEqual([]);
});
