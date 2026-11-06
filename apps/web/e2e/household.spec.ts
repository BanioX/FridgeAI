import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('exports the data as JSON and CSV and deletes everything after asking', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Joghurt');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await page.getByRole('navigation').getByRole('link', { name: 'Haushalt' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Haushalt' })).toBeVisible();
  await expect(page.getByText('Kein Konto, kein Tracking, keine Werbung.')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  const [json] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Alles exportieren (JSON)' }).click(),
  ]);
  expect(json.suggestedFilename()).toMatch(/^fridgeai-\d{4}-\d{2}-\d{2}\.json$/);
  const data = JSON.parse(await readFile(await json.path(), 'utf8')) as {
    format: string;
    items: unknown[];
  };
  expect(data.format).toBe('fridgeai-export');
  expect(data.items).toHaveLength(1);
  await expect(page.getByRole('status')).toHaveText(`${json.suggestedFilename()} ist gespeichert.`);

  const [csv] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Vorrat als Tabelle (CSV)' }).click(),
  ]);
  const table = await readFile(await csv.path(), 'utf8');
  expect(table).toContain('Name;Menge;Einheit;Lagerort;Haltbar bis');
  expect(table).toMatch(/\r\nJoghurt;1;Stk\.;Kühlschrank;\d{2}\.\d{2}\.\d{4};/);

  await page.getByRole('button', { name: 'Alles löschen' }).click();
  await expect(page.getByText(/^Wirklich alles löschen\?/)).toBeVisible();
  await page.getByRole('button', { name: 'Abbrechen' }).click();
  await page.getByRole('button', { name: 'Alles löschen' }).click();
  await page.getByRole('button', { name: 'Ja, alles löschen' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Heute retten' })).toBeVisible();
  await page.goto('/inventory');
  await expect(page.getByText('Hier liegt noch nichts.')).toBeVisible();
});
