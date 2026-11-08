import { AxeBuilder, expect, test } from './test';

/**
 * «Das wirfst du oft weg» (ADR-0038): twice a dip in the bin, and the next dip gets a tip. Also
 * «Von der Theke»: loose Mozzarella keeps like an open pack.
 */
test('hints at what is often thrown away, and keeps loose cheese like an open pack', async ({
  page,
}) => {
  for (const name of ['Hummus Natur', 'Tzatziki']) {
    await page.goto('/inventory/new');
    await page.getByLabel('Was ist es?').fill(name);
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await page.getByRole('link', { name: new RegExp(name) }).click();
    await page.locator('label').filter({ hasText: 'Weggeworfen' }).click();
    await page.getByRole('button', { name: 'Als weggeworfen speichern' }).click();
    await expect(page.getByRole('status')).toHaveText(`${name}: als weggeworfen gespeichert.`);
  }

  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Guacamole');
  await expect(
    page.getByText('Tzatziki, Hummus Natur: in den letzten 3 Monaten 2× weggeworfen.'),
  ).toBeVisible();
  await expect(page.getByText(/lieber die kleine Packung kaufen/)).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // Something else, no hint; loose Mozzarella from the counter keeps about 3 days.
  await page.getByLabel('Was ist es?').fill('Mozzarella');
  await expect(page.getByText(/weggeworfen\.$/)).toHaveCount(0);
  await page.getByRole('radio', { name: 'Von der Theke' }).check({ force: true });
  await expect(
    page.getByText('Offen gekauft hält es etwa 3 Tage.', { exact: false }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
