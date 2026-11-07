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

test('matches a receipt with Open Food Facts only after one tap and a «Passt»', async ({
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
  await page.route(PRODUCT, (route) =>
    route.fulfill({
      json: {
        status: 1,
        product: { product_name_de: 'Joghurt Mocca', brands: 'Naturaplan', quantity: '180 g' },
      },
    }),
  );

  await page.goto('/add/receipt');
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'bon.pdf',
    mimeType: 'application/pdf',
    buffer: COOP,
  });
  const review = page.getByRole('region', { name: /Musterstadt Zentrum/ });
  await expect(review.getByText('Summe stimmt: CHF 4.45')).toBeVisible();
  // Reading a receipt sends nothing.
  expect(searches).toEqual([]);

  await review.getByRole('button', { name: 'Mit Open Food Facts abgleichen' }).click();
  await expect(review.getByText(/1 von 2 gefunden/)).toBeVisible();
  // Only the product words went out, no prices, sizes, shop or date.
  expect(searches[0]).toBe('Naturaplan Bio Joghurt Mocca');
  expect(searches.join(' ')).not.toMatch(/0\.95|180g|Musterstadt|06\.11/);

  const fits = review.getByRole('button', { name: 'Passt: Joghurt Mocca' });
  await expect(fits).toHaveAttribute('aria-pressed', 'false');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await fits.click();
  await expect(fits).toHaveAttribute('aria-pressed', 'true');

  await review.getByRole('button', { name: '2 Artikel übernehmen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  // The confirmed product names the item; the other line keeps its printed name.
  await expect(page.getByText('Joghurt Mocca', { exact: true })).toBeVisible();
  await expect(page.getByText('Guacamole Chunky')).toBeVisible();
});
