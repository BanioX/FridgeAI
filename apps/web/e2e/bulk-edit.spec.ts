import type { Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

async function addToFridge(page: Page, name: string) {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill(name);
  if (await page.getByLabel('Menge').isHidden()) {
    await page.getByText('Mehr Angaben').click();
  }
  await page.getByLabel('Menge').fill('2');
  await page.getByLabel('Einheit').selectOption('pcs');
  await page.getByRole('radio', { name: 'Kühlschrank' }).check();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
}

test('changes the date of several items and marks several as opened', async ({ page }) => {
  for (const name of ['Eier', 'Saft', 'Joghurt']) {
    await addToFridge(page, name);
  }
  await page.goto('/inventory?location=fridge');
  await page.getByRole('button', { name: 'Auswählen' }).click();
  await page.getByText('Eier', { exact: true }).click();
  await page.getByText('Saft', { exact: true }).click();
  await expect(page.getByText('2 ausgewählt')).toBeVisible();

  const edit = page.getByRole('button', { name: 'Ändern' });
  expect((await edit.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await edit.click();
  const sheet = page.getByRole('dialog', { name: '2 Artikel ändern' });
  await expect(sheet).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);

  await sheet.getByRole('button', { name: '1 Woche' }).click();
  await sheet.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(page.getByRole('status')).toHaveText('2 Artikel geändert.');
  // Select mode ended; the two rows show the new date.
  await expect(page.getByRole('button', { name: 'Auswählen' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Eier/ })).toContainText('in 7 Tagen');
  await expect(page.getByRole('link', { name: /Saft/ })).toContainText('in 7 Tagen');

  // Mark two as opened.
  await page.getByRole('button', { name: 'Auswählen' }).click();
  await page.getByText('Eier', { exact: true }).click();
  await page.getByText('Joghurt', { exact: true }).click();
  await page.getByRole('button', { name: 'Ändern' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Alle als angebrochen markieren' })
    .click();
  await expect(page.getByRole('status')).toHaveText('2 Artikel geändert.');
  await expect(page.getByRole('link', { name: /Eier/ })).toContainText('Geöffnet');
  await expect(page.getByRole('link', { name: /Joghurt/ })).toContainText('Geöffnet');
  await expect(page.getByRole('link', { name: /Saft/ })).not.toContainText('Geöffnet');
});
