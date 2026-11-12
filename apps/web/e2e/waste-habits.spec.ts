import { AxeBuilder, expect, test } from './test';

/**
 * «Das entsorgst du oft» (ADR-0038): twice a dip in the bin, and the next dip gets a tip. Also
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
    await page.locator('label').filter({ hasText: 'Entsorgt' }).click();
    await page.getByRole('button', { name: 'Als entsorgt speichern' }).click();
    await expect(page.getByRole('status')).toHaveText(`${name}: als entsorgt gespeichert.`);
  }

  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Guacamole');
  await expect(
    page.getByText('Tzatziki, Hummus Natur: in den letzten 3 Monaten 2× entsorgt.'),
  ).toBeVisible();
  await expect(page.getByText(/lieber die kleine Packung kaufen/)).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // Something else, no hint; loose Mozzarella from the counter keeps about 3 days.
  await page.getByLabel('Was ist es?').fill('Mozzarella');
  await expect(page.getByText(/entsorgt\.$/)).toHaveCount(0);
  await page.getByRole('radio', { name: 'Von der Theke' }).check({ force: true });
  await expect(
    page.getByText('Offen gekauft hält es etwa 3 Tage.', { exact: false }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('a sealed pack opened on the day it came home is Geöffnet, not Von der Theke', async ({
  page,
}) => {
  // Alban, 12.11.2026: a sealed Mozzarella, opened at home the day it was bought.
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Mozzarella');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await page.getByRole('link', { name: /Mozzarella/ }).click();
  await page.getByRole('button', { name: 'Als geöffnet markieren' }).click();
  await expect(page.getByRole('status')).toContainText('Geöffnet.');
  await expect(page.getByText('Geöffnet', { exact: true })).toBeVisible();
  await expect(page.getByText('Von der Theke', { exact: true })).toHaveCount(0);

  // Bought at the counter, it says so.
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Mozzarella');
  await page.getByRole('radio', { name: 'Von der Theke' }).check({ force: true });
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByText('Von der Theke', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Geöffnet', { exact: true })).toHaveCount(1);
});
