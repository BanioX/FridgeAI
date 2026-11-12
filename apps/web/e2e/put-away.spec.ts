import { AxeBuilder, expect, test } from './test';
import { textPdf } from './pdf';

test.use({ viewport: { width: 390, height: 844 } });

// An invented receipt (as in receipt-upload): chicken for the fridge, bread for the pantry.
const BON = textPdf([
  'Musterstadt Zentrum',
  '05.11.26 18:47 00123 00456789 001 0001234',
  'Artikel Menge Preis Aktion Total Zusatz',
  'Semmeli 80G 2.0 0.70 1.40 0 A',
  'Coop Pouletbrust 2St. ca. 330g 0.307 10.40 8.30 8.30 0 A',
  'Total CHF 9.70',
  'Mastercard 9.70',
  'GR MWST% TOTAL MWST',
  '0 2.60 9.70 0.25',
]);

test('puts away after a receipt: per location and spot, then on to the Vorrat', async ({
  page,
}) => {
  await page.goto('/add/receipt');
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'bon.pdf',
    mimeType: 'application/pdf',
    buffer: BON,
  });
  await page
    .getByRole('button', { name: /Artikel übernehmen/ })
    .first()
    .click();

  await expect(page.getByRole('heading', { level: 1, name: 'Einräumen' })).toBeVisible();
  await expect(page).toHaveURL(/\/inventory\/put-away\?item=/);
  await expect(page.getByText('Was wohin gehört: 2 Artikel aus deiner Quittung.')).toBeVisible();
  const fridge = page.getByRole('region', { name: 'Kühlschrank' });
  await expect(fridge.getByText('Coop Pouletbrust 2St. ca. 330g')).toBeVisible();
  // No place is saved yet: no «Ohne festen Platz» heading over a lone group.
  await expect(fridge.getByRole('heading', { level: 3 })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Vorrat' }).getByText('Semmeli 80G')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // A row opens the item, where a place can be set.
  await fridge.getByRole('link', { name: /Coop Pouletbrust/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Coop Pouletbrust/ })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Einräumen' })).toBeVisible();

  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page).toHaveURL(/\/inventory\?location=fridge/);
  await expect(page.getByText('Coop Pouletbrust 2St. ca. 330g')).toBeVisible();
});

test('a link without articles that still exist leads back to the Vorrat', async ({ page }) => {
  await page.goto('/inventory/put-away?item=gone');
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page).toHaveURL(/\/inventory$/);
});
