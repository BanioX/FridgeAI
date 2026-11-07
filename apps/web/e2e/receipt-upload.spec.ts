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
  'Dreamies mit Lachs 1.0 2.50 2.50 0 A',
  'Oecoplan Papiertasche 1.0 0.40 0.40 1 # A',
  'Total CHF 15.55',
  'Mastercard 15.55',
  'GR MWST% TOTAL MWST',
  '1 8.10 3.35 0.25',
  '0 2.60 9.70 0.25',
]);

test('uploads a receipt PDF, shows names and prices and takes the food over', async ({ page }) => {
  await page.goto('/add/receipt');
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'bon.pdf',
    mimeType: 'application/pdf',
    buffer: COOP,
  });
  const review = page.getByRole('region', { name: /Coop · Musterstadt Zentrum · 05\.11\.2026/ });
  await expect(review).toBeVisible();
  await expect(review.getByText('Summe stimmt: CHF 15.55')).toBeVisible();
  await expect(review.getByRole('checkbox', { name: /Semmeli 80G/ })).toBeChecked();
  await expect(
    review.getByRole('checkbox', { name: /Coop Pouletbrust.*statt 10\.40/ }),
  ).toBeChecked();
  await expect(
    review.getByRole('button', { name: /Preis von Coop Pouletbrust.*jetzt 8\.30/ }),
  ).toBeVisible();
  await expect(
    review.getByRole('checkbox', { name: /Shampoo Classic.*kein Lebensmittel/ }),
  ).not.toBeChecked();
  // Pet food has the reduced VAT rate like food, but it does not belong in the fridge.
  await expect(
    review.getByRole('checkbox', { name: /Dreamies mit Lachs.*kein Lebensmittel/ }),
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
  await page.goto('/add/receipt');
  await page
    .getByLabel('PDF oder Foto wählen')
    .setInputFiles({ name: 'bon.pdf', mimeType: 'application/pdf', buffer: COOP });
  await page.getByRole('button', { name: '2 Artikel übernehmen' }).click();
  await expect(page.getByText('Diesen Bon hast du schon übernommen.')).toBeVisible();
});

test('explains a PDF without text and one without articles', async ({ page }) => {
  await page.goto('/add/receipt');
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'leer.pdf',
    mimeType: 'application/pdf',
    buffer: textPdf(['Vielen Dank fuer Ihren Besuch']),
  });
  await expect(page.getByText('Auf diesem Bon hat Rettich keine Artikel gefunden.')).toBeVisible();
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'bild.pdf',
    mimeType: 'application/pdf',
    buffer: textPdf([]),
  });
  await expect(page.getByText(/kein lesbarer Text/)).toBeVisible();
});

test('reads a receipt screenshot on the device', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/add/receipt');
  // An invented Lidl app receipt, drawn in the browser as a screenshot would look.
  const dataUrl = await page.evaluate(
    (lines) => {
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
      context.font = '32px monospace';
      lines.forEach((line, index) => {
        context.fillText(line, 24, 56 + index * 48);
      });
      return canvas.toDataURL('image/png');
    },
    [
      'www.lidl.ch',
      'Nashi Birnen          3.16 A',
      '  4 x 0.79',
      '  Lidl Plus Rabatt   -0.80',
      'Chickpic              6.90 A',
      '  2 x 3.45',
      'Men Shampoo           2.99 B',
      'Dein Lidl Preis      12.25',
      'A 2.6 % MwSt von  9.26  0.23',
      'B 8.1 % MwSt von  2.99  0.22',
      '29.10.2026 18:55',
    ],
  );
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'lidl.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1] ?? '', 'base64'),
  });
  const review = page.getByRole('region', { name: /Lidl · 29\.10\.2026/ });
  await expect(review).toBeVisible({ timeout: 60_000 });
  await expect(review.getByText('Summe stimmt: CHF 12.25')).toBeVisible();
  await expect(review.getByRole('checkbox', { name: /Nashi Birnen.*4 Stück/ })).toBeChecked();
  await expect(review.getByRole('checkbox', { name: /Men Shampoo/ })).not.toBeChecked();
  await expect(review.getByRole('button', { name: '2 Artikel übernehmen' })).toBeEnabled();
});

test('a misread price is corrected with a tap and the sum is checked again', async ({ page }) => {
  await page.goto('/add/receipt');
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'bon.pdf',
    mimeType: 'application/pdf',
    buffer: textPdf([
      'Coop',
      'Skyr Heidelbeere 1.0 0.99 9.99 0 A',
      'Kraeuter-Baguette 1.0 0.99 0.99 0 A',
      'Total CHF 1.98',
      '0 2.60 1.98 0.05',
    ]),
  });
  const review = page.getByRole('region', { name: /Coop/ });
  await expect(
    review.getByText(/Die Summe stimmt nicht: gelesen CHF 10\.98, auf dem Bon CHF 1\.98/),
  ).toBeVisible();
  await review.getByRole('button', { name: /Preis von Skyr Heidelbeere .*jetzt 9\.99/ }).click();
  const field = review.getByLabel('Preis von Skyr Heidelbeere in CHF');
  await field.fill('0.99');
  await field.press('Enter');
  await expect(review.getByText('Summe stimmt: CHF 1.98')).toBeVisible();
  await expect(
    review.getByRole('button', { name: /Preis von Skyr Heidelbeere .*jetzt 0\.99/ }),
  ).toBeVisible();
});

test('remembers prices: «zuletzt …» and «… % teurer als sonst» on the next receipts', async ({
  page,
}) => {
  const semmeli = (day: string, line: string, total: string) =>
    textPdf([
      'Musterstadt Zentrum',
      `${day} 18:47 00123`,
      line,
      `Total CHF ${total}`,
      '0 2.60 1.00 0.03',
    ]);
  const upload = async (buffer: Buffer) => {
    await page.goto('/add/receipt');
    await page
      .getByLabel('PDF oder Foto wählen')
      .setInputFiles({ name: 'bon.pdf', mimeType: 'application/pdf', buffer });
    return page.getByRole('region', { name: /Coop|Laden/ });
  };
  // Invented receipts; «Coop» is in the product name, so the shop is recognised.
  let review = await upload(semmeli('01.11.26', 'Coop Semmeli 80G 2.0 0.70 1.40 0 A', '1.40'));
  await review.getByRole('button', { name: '1 Artikel übernehmen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  review = await upload(semmeli('03.11.26', 'Coop Semmeli 80G 2.0 0.85 1.70 0 A', '1.70'));
  await expect(review.getByText('zuletzt 0.70/Stück bei Coop')).toBeVisible();
  await review.getByRole('button', { name: '1 Artikel übernehmen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  review = await upload(semmeli('06.11.26', 'Coop Semmeli 80G 1.0 0.95 0.95 0 A', '0.95'));
  await expect(review.getByText('22 % teurer als sonst')).toBeVisible();
  await review.getByRole('button', { name: '1 Artikel übernehmen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();

  // The item page and the add form remember too (dates in the text, the 120-day window aside).
  await page.goto('/inventory?location=pantry');
  await page
    .getByRole('link', { name: /Coop Semmeli 80G/ })
    .first()
    .click();
  await expect(page.getByText(/Zuletzt 0\.95 bei Coop \(06\.11\.2026\)/)).toBeVisible();
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Coop Semmeli 80G');
  await expect(page.getByText(/Zuletzt 0\.95 bei Coop/)).toBeVisible();
});
