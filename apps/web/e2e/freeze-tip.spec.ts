import { AxeBuilder, expect, test } from './test';

/** K4: mince due tomorrow is frozen with one tap on Start, and «Rückgängig» brings it back. */
test('freezes an item due tomorrow with one tap on Start and undoes it', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Hackfleisch');
  await page.getByRole('button', { name: 'morgen', exact: true }).click();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('link', { name: /Hackfleisch/ })).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  const freeze = page.getByRole('button', { name: 'Hackfleisch einfrieren' });
  await expect(freeze).toBeVisible();
  const start = await new AxeBuilder({ page }).analyze();
  expect(start.violations).toEqual([]);

  await freeze.click();
  await expect(page.getByRole('status')).toContainText('Hackfleisch eingefroren. Haltbar bis');
  await expect(freeze).toHaveCount(0);

  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('button', { name: 'Hackfleisch einfrieren' })).toBeVisible();
});
