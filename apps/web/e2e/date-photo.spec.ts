import type { Page } from '@playwright/test';
import { expect, test } from './test';

/** An invented label, drawn in the browser as a photo of a pack would look. */
async function labelPhoto(page: Page, text: string) {
  const dataUrl = await page.evaluate((label) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1100;
    canvas.height = 140;
    const context = canvas.getContext('2d');
    if (context === null) {
      return '';
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000000';
    context.font = 'bold 48px monospace';
    context.fillText(label, 24, 85);
    return canvas.toDataURL('image/png');
  }, text);
  return {
    name: 'datum.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1] ?? '', 'base64'),
  };
}

test('reads a best-before date from a photo on the device (ADR-0062)', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/inventory/new');
  await page
    .getByLabel('Datum fotografieren')
    .setInputFiles(await labelPhoto(page, 'MINDESTENS HALTBAR BIS 14.12.2027'));
  await expect(page.getByLabel('Haltbar bis')).toHaveValue('14.12.2027', { timeout: 60_000 });
  await expect(page.getByText('Gelesen: 14.12.2027. Stimmt das?')).toBeVisible();
});

test('reads the date from a photo when editing an item as well', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Butter');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByText('Butter').click();
  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  await page
    .getByLabel('Datum fotografieren')
    .setInputFiles(await labelPhoto(page, 'MINDESTENS HALTBAR BIS 14.12.2027'));
  await expect(page.getByLabel('Haltbar bis')).toHaveValue('14.12.2027', { timeout: 60_000 });
  await expect(page.getByText('Gelesen: 14.12.2027. Stimmt das?')).toBeVisible();
  await page.getByRole('button', { name: 'Änderungen speichern' }).click();
  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  await expect(page.getByLabel('Haltbar bis')).toHaveValue('14.12.2027');
});
