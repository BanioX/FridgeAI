import { AxeBuilder, expect, test } from './test';
import { readFile } from 'node:fs/promises';

test('exports the data, deletes everything after asking and imports the export again', async ({
  page,
}) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Joghurt');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await page.getByRole('navigation').getByRole('link', { name: 'Mehr' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mehr' })).toBeVisible();
  await expect(page.getByText('Schnittstelle')).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('link', { name: /^Deine Daten/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Deine Daten' })).toBeVisible();
  await expect(page.getByText('Kein Konto, kein Tracking, keine Werbung.')).toBeVisible();
  // Visible backups: the page says when this device last exported.
  await expect(page.getByText('Noch keine Sicherung von diesem Gerät.')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  const [json] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Alles exportieren (JSON)' }).click(),
  ]);
  expect(json.suggestedFilename()).toMatch(/^rettich-\d{4}-\d{2}-\d{2}\.json$/);
  const data = JSON.parse(await readFile(await json.path(), 'utf8')) as {
    format: string;
    items: unknown[];
  };
  expect(data.format).toBe('fridgeai-export');
  expect(data.items).toHaveLength(1);
  await expect(page.getByRole('status')).toHaveText(`${json.suggestedFilename()} ist gespeichert.`);
  await expect(page.getByText(/^Letzte Sicherung: \d{2}\.\d{2}\.\d{4}\.$/)).toBeVisible();

  await expect(page.getByRole('button', { name: /CSV/ })).toHaveCount(0);

  await page.getByRole('button', { name: 'Alles löschen' }).click();
  await expect(page.getByText(/^Wirklich alles löschen\?/)).toBeVisible();
  await page.getByRole('button', { name: 'Abbrechen' }).click();
  await page.getByRole('button', { name: 'Alles löschen' }).click();
  await page.getByRole('button', { name: 'Ja, alles löschen' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Start' })).toBeVisible();
  await page.goto('/inventory');
  await expect(page.getByText('Hier liegt noch nichts.')).toBeVisible();

  // On a new device or web address: bring the export back.
  await page.goto('/more/data');
  const picker = page.getByLabel('Exportdatei wählen');
  await picker.setInputFiles({
    name: 'notiz.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"format":"other"}'),
  });
  await expect(page.getByRole('status')).toHaveText(/^Diese Datei ist kein Rettich-Export\./);
  await picker.setInputFiles({
    name: json.suggestedFilename(),
    mimeType: 'application/json',
    buffer: await readFile(await json.path()),
  });
  await expect(
    page.getByText(`${json.suggestedFilename()} übernehmen? Darin sind 1 Artikel.`, {
      exact: false,
    }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Ja, übernehmen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Start' })).toBeVisible();
  await page.goto('/inventory');
  await expect(page.getByText('Joghurt')).toBeVisible();
});
