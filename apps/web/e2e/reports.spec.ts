import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { expect, test } from './test';

test('creates a PDF report on the device and hands it over', async ({ page }) => {
  for (const name of ['Joghurt', 'Vollmilch']) {
    await page.goto('/inventory/new');
    await page.getByLabel('Was ist es?').fill(name);
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  }

  await page.getByRole('navigation').getByRole('link', { name: 'Mehr' }).click();
  await page.getByRole('link', { name: /^Berichte als PDF/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Berichte als PDF' })).toBeVisible();
  await page.getByRole('radio', { name: 'Kühlschrank jetzt' }).check({ force: true });
  await page.getByRole('radio', { name: 'Dieses Jahr' }).check({ force: true });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  // No share sheet in desktop Chromium: the PDF goes to the downloads.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'PDF erstellen' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^rettich-fridge-\d{4}-\d{2}-\d{2}\.pdf$/);
  const pdf = await readFile(await download.path());
  expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  expect(pdf.toString('latin1')).toContain('rettich');
  expect(pdf.length).toBeGreaterThan(2000);
  await expect(page.getByText('Das PDF ist bereit.')).toBeVisible();
});
