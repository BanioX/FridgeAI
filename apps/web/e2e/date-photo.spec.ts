import { expect, test } from './test';

test('reads a best-before date from a photo on the device (ADR-0062)', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/inventory/new');
  // An invented label, drawn in the browser as a photo of a pack would look.
  const dataUrl = await page.evaluate((text) => {
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
    context.fillText(text, 24, 85);
    return canvas.toDataURL('image/png');
  }, 'MINDESTENS HALTBAR BIS 14.12.2027');
  await page.getByLabel('Datum fotografieren').setInputFiles({
    name: 'datum.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1] ?? '', 'base64'),
  });
  await expect(page.getByLabel('Haltbar bis')).toHaveValue('14.12.2027', { timeout: 60_000 });
  await expect(page.getByText('Gelesen: 14.12.2027. Stimmt das?')).toBeVisible();
});
