import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';
import { textPdf } from './pdf';

// Open Food Facts is never called for real in tests (ADR-0036).
const SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl**';
const PRODUCT = 'https://world.openfoodfacts.org/api/v2/product/**';

// An invented receipt in the layout of a Coop PDF (shop not named, so it reads as «Laden»).
const COOP = textPdf([
  'Musterstadt Zentrum',
  '06.11.26 17:12 00123 00456789 001 0001235',
  'Artikel Menge Preis Aktion Total Zusatz',
  'Naturaplan Bio Joghurt Mocca 180g 1.0 0.95 0.95 0 A',
  'Guacamole Chunky 1.0 3.50 3.50 0 A',
  'Total CHF 4.45',
  'Mastercard 4.45',
]);

test('matches a receipt with Open Food Facts by itself; Ja takes a hit, Nein offers the barcode', async ({
  page,
}) => {
  const searches: string[] = [];
  await page.route(SEARCH, (route) => {
    const url = new URL(route.request().url());
    const terms = url.searchParams.get('search_terms') ?? '';
    searches.push(terms);
    return route.fulfill({
      json: {
        count: 1,
        products: terms.includes('Joghurt')
          ? [
              {
                code: '7610000000004',
                product_name_de: 'Joghurt Mocca',
                brands: 'Naturaplan',
                quantity: '180 g',
              },
            ]
          : [],
      },
    });
  });
  await page.route(PRODUCT, (route) => {
    const known = route.request().url().includes('7610000000004');
    return route.fulfill(
      known
        ? {
            json: {
              status: 1,
              product: {
                product_name_de: 'Joghurt Mocca',
                brands: 'Naturaplan',
                quantity: '180 g',
              },
            },
          }
        : {
            json: {
              status: 1,
              product: { product_name_de: 'Guacamole', brands: 'Anna’s Best', quantity: '200 g' },
            },
          },
    );
  });

  await page.goto('/add/receipt');
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'bon.pdf',
    mimeType: 'application/pdf',
    buffer: COOP,
  });
  const review = page.getByRole('region', { name: /Musterstadt Zentrum/ });
  await expect(review.getByText('Summe stimmt: CHF 4.45')).toBeVisible();

  // The matching starts by itself and says what it found.
  await expect(review.getByText('1 von 2 gefunden.')).toBeVisible();
  // Only the product words went out, no prices, sizes, shop or date.
  expect(searches[0]).toBe('Naturaplan Bio Joghurt Mocca');
  expect(searches.join(' ')).not.toMatch(/0\.95|180g|Musterstadt|06\.11/);
  await expect(review.getByText(/Tippe auf «Barcode scannen»/)).toBeVisible();

  const yes = review.getByRole('button', { name: 'Ja, das ist Joghurt Mocca' });
  await expect(yes).toHaveAttribute('aria-pressed', 'false');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await yes.click();
  await expect(yes).toHaveAttribute('aria-pressed', 'true');

  // «Nein» drops a hit and offers the barcode instead.
  await review.getByRole('button', { name: 'Nein, das ist nicht Joghurt Mocca' }).click();
  await expect(review.getByText('Abgelehnt')).toBeVisible();
  await review
    .getByRole('button', { name: 'Barcode scannen für Naturaplan Bio Joghurt Mocca 180g' })
    .click();
  await review.getByLabel('Nummer unter dem Strichcode').fill('7610000000004');
  await review.getByRole('button', { name: 'Übernehmen', exact: true }).click();
  await expect(review.getByText('Per Barcode')).toBeVisible();

  // Guacamole had no hit: its barcode is scanned and counts as confirmed.
  await review.getByRole('button', { name: 'Barcode scannen für Guacamole Chunky' }).click();
  await review.getByLabel('Nummer unter dem Strichcode').fill('7613404000007');
  await review.getByRole('button', { name: 'Übernehmen', exact: true }).click();
  await expect(review.getByRole('button', { name: 'Ja, das ist Guacamole' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await review.getByRole('button', { name: '2 Artikel übernehmen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByText('Joghurt Mocca', { exact: true })).toBeVisible();
  await expect(page.getByText('Guacamole', { exact: true })).toBeVisible();
});
