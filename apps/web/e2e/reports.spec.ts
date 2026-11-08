import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { expect, test } from './test';

test('creates a PDF report on the device, opens it in the app and shares it', async ({ page }) => {
  for (const name of ['Joghurt', 'Vollmilch']) {
    await page.goto('/inventory/new');
    await page.getByLabel('Was ist es?').fill(name);
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  }

  await page.getByRole('navigation').getByRole('link', { name: 'Mehr' }).click();
  await page.getByRole('link', { name: /^Berichte als PDF/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Berichte als PDF' })).toBeVisible();
  // The short reports are receipts; «Ausführlich» is the full report with a period.
  await page.getByRole('radio', { name: 'Ausführlich' }).check({ force: true });
  await page.getByRole('radio', { name: 'Dieses Jahr' }).check({ force: true });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  // The report opens inside the app, page by page.
  await page.getByRole('button', { name: 'PDF erstellen' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Ausführlich · Dieses Jahr' }),
  ).toBeVisible();
  await expect(page.getByRole('img', { name: /^1 von \d+$/ })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // No share sheet in desktop Chromium: «Teilen» puts the PDF into the downloads.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Teilen' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^rettich-bericht-\d{4}-\d{2}-\d{2}\.pdf$/);
  const pdf = await readFile(await download.path());
  expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  expect(pdf.toString('latin1')).toContain('Rettich');
  expect(pdf.length).toBeGreaterThan(2000);
  // Back like in a banking app: to the report choice.
  await page.getByRole('button', { name: 'Berichte' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Berichte als PDF' })).toBeVisible();

  // A quick receipt: what expires within a chosen number of days. No period to choose.
  await page.getByRole('radio', { name: 'Läuft bald ab' }).check({ force: true });
  await expect(page.getByRole('radio', { name: 'Dieses Jahr' })).toHaveCount(0);
  await page.getByRole('radio', { name: 'Eigene' }).check({ force: true });
  await page.getByLabel('Anzahl Tage (1 bis 60)').fill('10');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'PDF erstellen' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Läuft bald ab · nächste 10 Tage' }),
  ).toBeVisible();
  const [receipt] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Teilen' }).click(),
  ]);
  expect(receipt.suggestedFilename()).toMatch(/^rettich-quittung-expiring-\d{4}-\d{2}-\d{2}\.pdf$/);
});
