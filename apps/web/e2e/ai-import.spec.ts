import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

// What ChatGPT, Claude or Gemini typically answer to the FridgeAI prompt: chatter plus a fence.
const answer = [
  'Hier ist die Liste aus deinem Foto:',
  '```json',
  '{"fridgeai":1,"items":[',
  ' {"name":"Vollmilch","quantity":1,"unit":"l","location":"fridge","expiresOn":"2030-01-15"},',
  ' {"name":"Erbsen","quantity":750,"unit":"g","location":"freezer"},',
  ' {"name":"Putzmittel","quantity":1,"unit":"pcs"},',
  ' {"name":""}',
  ']}',
  '```',
].join('\n');

test('imports what the own AI recognised after a review', async ({ page }) => {
  await page.goto('/add/ai');
  await page.getByRole('button', { name: 'Auftrag kopieren' }).click();
  await expect(page.getByText('Kopiert. Jetzt in deine KI einfügen.')).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('{"fridgeai":1,"items":[');

  await page.getByLabel('Antwort der KI').fill(answer);
  await page.getByRole('button', { name: 'Prüfen' }).click();

  await expect(page.getByRole('heading', { name: '3 Artikel erkannt' })).toBeVisible();
  await expect(page.getByText('1 Eintrag konnte FridgeAI nicht lesen:')).toBeVisible();
  await expect(page.getByText('1 l · bis 15.01.2030')).toBeVisible();
  await expect(page.getByLabel('Lagerort für Erbsen')).toHaveValue('freezer');

  const review = await new AxeBuilder({ page }).analyze();
  expect(review.violations).toEqual([]);

  // Leave out what does not belong in the fridge app.
  await page.getByRole('checkbox', { name: /Putzmittel/ }).uncheck();
  await page.getByRole('button', { name: '2 Artikel übernehmen' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByText('Vollmilch')).toBeVisible();
  await expect(page.getByText('Putzmittel')).toHaveCount(0);
  await page.getByRole('tab', { name: /Tiefkühler/ }).click();
  await expect(page.getByText('Erbsen')).toBeVisible();
});

test('explains when the answer contains no items', async ({ page }) => {
  await page.goto('/add/ai');
  await page.getByLabel('Antwort der KI').fill('Ich kann auf dem Bild leider nichts erkennen.');
  await page.getByRole('button', { name: 'Prüfen' }).click();
  await expect(page.getByText(/keine Artikel gefunden/)).toBeVisible();
});
