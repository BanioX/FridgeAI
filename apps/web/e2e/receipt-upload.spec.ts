import { AxeBuilder, expect, test } from './test';
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
  // The button stands at the top, right after the shop chooser and the sum, and again at the bottom.
  const buttons = page.getByRole('button', { name: '2 Artikel übernehmen' });
  await expect(buttons).toHaveCount(2);
  const top = await buttons.first().boundingBox();
  const firstLine = await review.getByRole('checkbox', { name: /Semmeli 80G/ }).boundingBox();
  expect(top?.y).toBeLessThan(firstLine?.y ?? 0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await review.getByRole('button', { name: '2 Artikel übernehmen' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einräumen' })).toBeVisible();
  // «Einräumen» tells where each new article goes: the fridge first, then the pantry.
  await expect(page.getByText('Was wohin gehört: 2 Artikel aus deiner Quittung.')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Kühlschrank' }).getByText('Coop Pouletbrust'),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Vorrat' }).getByText('Semmeli 80G')).toBeVisible();
  await expect(page.getByText('Coop Pouletbrust 2St. ca. 330g')).toBeVisible();
  await expect(page.getByText('Shampoo Classic')).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByText('Coop Pouletbrust 2St. ca. 330g')).toBeVisible();
  // The shop's monogram stands on the row, with its name as text for screen readers.
  const row = page.getByRole('link', { name: /Coop Pouletbrust/ });
  await expect(row).toContainText('Gekauft bei Coop');
  const vorrat = await new AxeBuilder({ page }).analyze();
  expect(vorrat.violations).toEqual([]);
  await row.click();
  await expect(page.getByText('Gekauft bei Coop')).toBeVisible();
  const detail = await new AxeBuilder({ page }).analyze();
  expect(detail.violations).toEqual([]);
  // Bread goes to the pantry tab.
  await page.goto('/inventory?location=pantry');
  await expect(page.getByText('Semmeli 80G')).toBeVisible();

  // The same receipt again is named at once and changes nothing.
  await page.goto('/add/receipt');
  await page
    .getByLabel('PDF oder Foto wählen')
    .setInputFiles({ name: 'bon.pdf', mimeType: 'application/pdf', buffer: COOP });
  await expect(page.getByText('Diese Quittung hast du schon übernommen.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Artikel übernehmen/ })).toHaveCount(0);
});

test('explains a PDF without text and one without articles', async ({ page }) => {
  await page.goto('/add/receipt');
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'leer.pdf',
    mimeType: 'application/pdf',
    buffer: textPdf(['Vielen Dank fuer Ihren Besuch']),
  });
  await expect(
    page.getByText('Auf dieser Quittung hat Rettich keine Artikel gefunden.'),
  ).toBeVisible();
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'bild.pdf',
    mimeType: 'application/pdf',
    buffer: textPdf([]),
  });
  await expect(page.getByText(/kein lesbarer Text/)).toBeVisible();
});

test('goes through the food lines one card at a time and takes what is kept', async ({ page }) => {
  await page.goto('/add/receipt');
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'bon.pdf',
    mimeType: 'application/pdf',
    buffer: COOP,
  });
  await page.getByRole('button', { name: 'Einzeln durchgehen' }).click();
  const cards = page.getByRole('dialog', { name: 'Einzeln durchgehen' });
  await expect(cards.getByText('1 von 2')).toBeVisible();
  await expect(cards.getByRole('heading', { level: 3, name: 'Semmeli 80G' })).toBeFocused();
  // Bread is left out; the chicken moves to the freezer.
  await cards.getByRole('button', { name: 'Nicht in den Vorrat' }).click();
  await expect(cards.getByText('2 von 2')).toBeVisible();
  await cards.locator('label', { hasText: 'Tiefkühler' }).click();
  await cards.getByRole('button', { name: 'Übernehmen', exact: true }).click();
  await expect(cards.getByText('1 übernommen, 1 weggelassen')).toBeVisible();
  await cards.getByRole('button', { name: '1 Artikel übernehmen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einräumen' })).toBeVisible();
  await expect(page.getByText('Semmeli 80G')).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Tiefkühler' }).getByText('Coop Pouletbrust'),
  ).toBeVisible();
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
  await expect(review.getByRole('button', { name: '2 Artikel übernehmen' }).first()).toBeEnabled();
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
    review.getByText(/Die Summe stimmt nicht: gelesen CHF 10\.98, auf der Quittung CHF 1\.98/),
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
  await review.getByRole('button', { name: '1 Artikel übernehmen' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einräumen' })).toBeVisible();
  review = await upload(semmeli('03.11.26', 'Coop Semmeli 80G 2.0 0.85 1.70 0 A', '1.70'));
  await expect(review.getByText('zuletzt 0.70/Stück bei Coop')).toBeVisible();
  await review.getByRole('button', { name: '1 Artikel übernehmen' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einräumen' })).toBeVisible();
  review = await upload(semmeli('06.11.26', 'Coop Semmeli 80G 1.0 0.95 0.95 0 A', '0.95'));
  await expect(review.getByText('22 % teurer als sonst')).toBeVisible();
  await review.getByRole('button', { name: '1 Artikel übernehmen' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einräumen' })).toBeVisible();

  // The item page and the add form remember too (dates in the text, the 120-day window aside).
  await page.goto('/inventory?location=pantry');
  await page
    .getByRole('link', { name: /Coop Semmeli 80G/ })
    .first()
    .click();
  await expect(page.getByText(/Zuletzt 0\.95 bei Coop \(06\.11\.2026\)/)).toBeVisible();
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Coop Semmeli 80G');
  // The price memory sits with the price, under «Mehr Angaben».
  await page.getByText('Mehr Angaben').click();
  await expect(page.getByText(/Zuletzt 0\.95 bei Coop/)).toBeVisible();
});

// A second invented receipt whose sum does not match: it must come first and stand open.
const SECOND = textPdf([
  'Musterdorf Bahnhof',
  '06.11.26 08:15 00124 00456790 002 0001235',
  'Artikel Menge Preis Aktion Total Zusatz',
  'Naturaplan Bio Vollmilch 1L 1.0 1.95 1.95 0 A',
  'Total CHF 2.95',
  'Twint 2.95',
]);

test('reviews several receipts on one page and takes them all with one button', async ({
  page,
}) => {
  // Phone width: the shop tabs do not fit and must scroll on their own.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/add/receipt');
  await page.getByLabel('PDF oder Foto wählen').setInputFiles([
    { name: 'eins.pdf', mimeType: 'application/pdf', buffer: COOP },
    { name: 'zwei.pdf', mimeType: 'application/pdf', buffer: SECOND },
  ]);
  const coop = page.getByRole('region', { name: /Coop · Musterstadt Zentrum · 05\.11\.2026/ });
  const dorf = page.getByRole('region', { name: /Musterdorf Bahnhof · 06\.11\.2026/ });
  await expect(coop).toBeVisible();
  await expect(dorf).toBeVisible();

  // The receipt with the wrong sum comes first, is marked and stands open; the other is folded.
  const dorfBox = await dorf.boundingBox();
  const coopBox = await coop.boundingBox();
  expect(dorfBox?.y).toBeLessThan(coopBox?.y ?? 0);
  await expect(dorf.getByText('Summe prüfen')).toBeVisible();
  const dorfToggle = dorf.getByRole('button', { name: /Musterdorf Bahnhof/ });
  const coopToggle = coop.getByRole('button', { name: /Musterstadt Zentrum/ });
  await expect(dorfToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(coopToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(coop.getByRole('checkbox', { name: /Semmeli 80G/ })).toBeHidden();

  // Fold and unfold.
  await coopToggle.click();
  await expect(coopToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(coop.getByRole('checkbox', { name: /Semmeli 80G/ })).toBeVisible();
  await expect(coop.getByText('Summe stimmt: CHF 15.55')).toBeVisible();
  await coopToggle.click();
  await expect(coopToggle).toHaveAttribute('aria-expanded', 'false');

  // The shop tabs scroll on their own; the page never scrolls sideways.
  await expect(dorf.getByRole('radio', { name: 'Laden' })).toBeChecked();
  await dorf.locator('label', { has: page.getByRole('radio', { name: 'Lidl' }) }).click();
  await dorf.locator('label', { has: page.getByRole('radio', { name: 'Coop' }) }).click();
  await expect(dorf.getByRole('radio', { name: 'Coop' })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // Leaving a receipt out takes its articles out of the count.
  await dorf.getByLabel('Diese Quittung nicht übernehmen').check();
  await expect(
    page.getByRole('button', { name: 'Alle übernehmen · 2 Artikel aus 1 Quittung' }),
  ).toHaveCount(2);
  await dorf.getByLabel('Diese Quittung nicht übernehmen').uncheck();

  // One button for all, at the top and at the bottom; nothing is left out.
  const all = page.getByRole('button', { name: 'Alle übernehmen · 3 Artikel aus 2 Quittungen' });
  await expect(all).toHaveCount(2);
  await all.first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einräumen' })).toBeVisible();
  await expect(page.getByText('Naturaplan Bio Vollmilch 1L')).toBeVisible();
  await expect(page.getByText('Coop Pouletbrust 2St. ca. 330g')).toBeVisible();
});

test('a known receipt is named before the review and never taken twice', async ({ page }) => {
  await page.goto('/add/receipt');
  const files = page.getByLabel('PDF oder Foto wählen');
  await files.setInputFiles({ name: 'alt.pdf', mimeType: 'application/pdf', buffer: COOP });
  await page.getByRole('button', { name: '2 Artikel übernehmen' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einräumen' })).toBeVisible();

  // The same receipt again, a new one, and the new one twice (same file under two names).
  await page.goto('/add/receipt');
  await files.setInputFiles([
    { name: 'alt.pdf', mimeType: 'application/pdf', buffer: COOP },
    { name: 'neu.pdf', mimeType: 'application/pdf', buffer: SECOND },
    { name: 'neu-kopie.pdf', mimeType: 'application/pdf', buffer: SECOND },
  ]);
  await expect(page.getByText('alt.pdf: schon erfasst')).toBeVisible();
  await expect(page.getByText('neu-kopie.pdf: schon erfasst')).toBeVisible();
  await expect(page.getByRole('region', { name: /Coop · Musterstadt Zentrum/ })).toHaveCount(0);
  const take = page.getByRole('button', { name: '1 Artikel übernehmen' });
  await expect(take).toHaveCount(2);
  await take.first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einräumen' })).toBeVisible();
  await expect(page.getByText('Naturaplan Bio Vollmilch 1L')).toBeVisible();
});

test('files that cannot be shown are listed; one receipt left looks like a single one', async ({
  page,
}) => {
  await page.goto('/add/receipt');
  await page.getByLabel('PDF oder Foto wählen').setInputFiles([
    { name: 'leer.pdf', mimeType: 'application/pdf', buffer: textPdf(['Danke']) },
    { name: 'zwei.pdf', mimeType: 'application/pdf', buffer: SECOND },
  ]);
  await expect(
    page.getByText('leer.pdf: Auf dieser Quittung hat Rettich keine Artikel gefunden.'),
  ).toBeVisible();
  const review = page.getByRole('region', { name: /Musterdorf Bahnhof/ });
  await expect(page.getByRole('button', { name: '1 Artikel übernehmen' })).toHaveCount(2);
  await expect(review.getByRole('checkbox', { name: /Naturaplan Bio Vollmilch/ })).toBeVisible();
  await expect(page.getByLabel('Diese Quittung nicht übernehmen')).toHaveCount(0);
});
