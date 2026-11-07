import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';
import { textPdf } from './pdf';

// An invented receipt in the layout of a Coop PDF (ADR-0027, ADR-0028).
const COOP = textPdf([
  'Musterstadt Zentrum',
  '05.11.26 18:47 00123 00456789 001 0001234',
  'Artikel Menge Preis Aktion Total Zusatz',
  'Semmeli 80G 2.0 0.70 1.40 0 A',
  'Coop Pouletbrust 2St. ca. 330g 0.307 10.40 8.30 8.30 0 A',
  'Shampoo Classic 1.0 2.95 2.95 1 A',
  'Oecoplan Papiertasche 1.0 0.40 0.40 1 # A',
  'Total CHF 13.05',
  'Mastercard 13.05',
  'GR MWST% TOTAL MWST',
  '1 8.10 3.35 0.25',
  '0 2.60 9.70 0.25',
]);

test('uploads a receipt PDF, shows names and prices and takes the food over', async ({ page }) => {
  await page.goto('/scan');
  await page.getByLabel('PDF wählen').setInputFiles({
    name: 'bon.pdf',
    mimeType: 'application/pdf',
    buffer: COOP,
  });
  const review = page.getByRole('region', { name: /Coop · Musterstadt Zentrum · 05\.11\.2026/ });
  await expect(review).toBeVisible();
  await expect(review.getByText('Summe stimmt: CHF 13.05')).toBeVisible();
  await expect(review.getByRole('checkbox', { name: /Semmeli 80G/ })).toBeChecked();
  await expect(
    review.getByRole('checkbox', { name: /Coop Pouletbrust.*statt 10\.40.*8\.30/ }),
  ).toBeChecked();
  await expect(
    review.getByRole('checkbox', { name: /Shampoo Classic.*kein Lebensmittel/ }),
  ).not.toBeChecked();
  await expect(review.getByText('Dazu Tasche, Pfand und Rabatte: CHF 0.40')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await review.getByRole('button', { name: '2 Artikel übernehmen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByText('Coop Pouletbrust 2St. ca. 330g')).toBeVisible();
  await expect(page.getByText('Shampoo Classic')).toHaveCount(0);
  // Bread goes to the pantry tab.
  await page.goto('/inventory?location=pantry');
  await expect(page.getByText('Semmeli 80G')).toBeVisible();

  // The same receipt again changes nothing.
  await page.goto('/scan');
  await page
    .getByLabel('PDF wählen')
    .setInputFiles({ name: 'bon.pdf', mimeType: 'application/pdf', buffer: COOP });
  await page.getByRole('button', { name: '2 Artikel übernehmen' }).click();
  await expect(page.getByText('Diesen Bon hast du schon übernommen.')).toBeVisible();
});

test('explains a PDF without text and one without articles', async ({ page }) => {
  await page.goto('/scan');
  await page.getByLabel('PDF wählen').setInputFiles({
    name: 'leer.pdf',
    mimeType: 'application/pdf',
    buffer: textPdf(['Vielen Dank fuer Ihren Besuch']),
  });
  await expect(page.getByText('Auf diesem Bon hat FridgeAI keine Artikel gefunden.')).toBeVisible();
  await page.getByLabel('PDF wählen').setInputFiles({
    name: 'bild.pdf',
    mimeType: 'application/pdf',
    buffer: textPdf([]),
  });
  await expect(page.getByText(/kein lesbarer Text/)).toBeVisible();
});
