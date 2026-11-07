import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';

// An invented nutrition table, drawn in the browser as a Migipedia screenshot would look.
const TABLE = [
  'Nährwerte pro 100 g',
  'Energie 1046 kJ (250 kcal)',
  'Fett 8.5 g',
  'davon gesättigte Fettsäuren 3.2 g',
  'Kohlenhydrate 32 g',
  'davon Zucker 12.5 g',
  'Ballaststoffe 2.1 g',
  'Eiweiss 6.4 g',
  'Salz 0.45 g',
];

test('reads the nutrition table of a screenshot on the device and saves it', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Haferbiscuits');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Haferbiscuits/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Haferbiscuits' })).toBeVisible();

  const card = page.locator('details').filter({ hasText: 'Nährwerte und Allergene' });
  await card.getByText('Nährwerte und Allergene').click();
  await expect(card.getByText(/Nährwerte fehlen\. Fotografiere die Nährwerttabelle/)).toBeVisible();

  const dataUrl = await page.evaluate((lines) => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 40 + lines.length * 48;
    const context = canvas.getContext('2d');
    if (context === null) {
      return '';
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000000';
    context.font = '32px sans-serif';
    lines.forEach((line, index) => {
      context.fillText(line, 24, 56 + index * 48);
    });
    return canvas.toDataURL('image/png');
  }, TABLE);
  await card.getByLabel('Foto oder Screenshot wählen').setInputFiles({
    name: 'tabelle.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1] ?? '', 'base64'),
  });

  await expect(
    card.getByText('Das hat rettich gelesen. Stimmt es mit der Packung überein?'),
  ).toBeVisible({
    timeout: 60_000,
  });
  const preview = card.getByRole('table', { name: 'pro 100 g' });
  await expect(preview.getByText('250 kcal')).toBeVisible();
  await expect(preview.getByText('8.5 g')).toBeVisible();
  await expect(preview.getByText('6.4 g')).toBeVisible();

  const results = await new AxeBuilder({ page }).include('details').analyze();
  expect(results.violations).toEqual([]);

  await card.getByRole('button', { name: 'Speichern' }).click();
  await expect(card.getByRole('button', { name: 'Speichern' })).toHaveCount(0);
  await expect(card.getByRole('table', { name: 'pro 100 g' }).getByText('250 kcal')).toBeVisible();
  await expect(
    card.getByText('Aus deinem Bild gelesen, ohne Gewähr. Massgebend ist die Packung.'),
  ).toBeVisible();
  await expect(card.getByRole('link', { name: /Open Food Facts/ })).toHaveCount(0);
  await expect(card.getByText('Nährwerte fehlen.')).toHaveCount(0);

  // Still there after a reload: it is saved on the product.
  await page.reload();
  await card.getByText('Nährwerte und Allergene').click();
  await expect(card.getByText('250 kcal')).toBeVisible();
  const saved = await new AxeBuilder({ page }).include('details').analyze();
  expect(saved.violations).toEqual([]);
});

test('says so when no nutrition table is found in the picture', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Haferbiscuits');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Haferbiscuits/ }).click();
  const card = page.locator('details').filter({ hasText: 'Nährwerte und Allergene' });
  await card.getByText('Nährwerte und Allergene').click();
  const blank = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const context = canvas.getContext('2d');
    if (context === null) {
      return '';
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 600, 200);
    context.fillStyle = '#000000';
    context.font = '32px sans-serif';
    context.fillText('Haferbiscuits 200 g', 24, 100);
    return canvas.toDataURL('image/png');
  });
  await card.getByLabel('Foto oder Screenshot wählen').setInputFiles({
    name: 'leer.png',
    mimeType: 'image/png',
    buffer: Buffer.from(blank.split(',')[1] ?? '', 'base64'),
  });
  await expect(
    card.getByText('Keine Nährwerttabelle erkannt. Versuch ein scharfes Bild nur von der Tabelle.'),
  ).toBeVisible({ timeout: 60_000 });
  await expect(card.getByRole('button', { name: 'Speichern' })).toHaveCount(0);
});
