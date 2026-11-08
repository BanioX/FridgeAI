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

test('four steps per article: Ja/Nein with preview, date, place and the import', async ({
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
                nutriscore_grade: 'b',
                nutriments: {
                  'energy-kcal_100g': 92,
                  fat_100g: 2.9,
                  sugars_100g: 12,
                  salt_100g: 0.11,
                },
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

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/add/receipt');
  await page.getByLabel('PDF oder Foto wählen').setInputFiles({
    name: 'bon.pdf',
    mimeType: 'application/pdf',
    buffer: COOP,
  });
  const review = page.getByRole('region', { name: /Musterstadt Zentrum/ });
  await expect(review.getByText('Summe stimmt: CHF 4.45')).toBeVisible();
  await expect(review.getByText('Vollständig: 0 von 2 Artikeln')).toBeVisible();

  // The matching starts by itself and says what it found.
  await expect(review.getByText('1 von 2 gefunden.')).toBeVisible();
  // Only the product words went out, no prices, sizes, shop or date.
  expect(searches[0]).toBe('Naturaplan Bio Joghurt Mocca');
  expect(searches.join(' ')).not.toMatch(/0\.95|180g|Musterstadt|06\.11/);
  await expect(review.getByText(/Tippe auf «Barcode scannen»/)).toBeVisible();

  // The first card opened by itself and shows the hit larger, with its key values.
  const joghurt = (done: number) =>
    review.getByRole('button', {
      name: new RegExp(`Joghurt Mocca.*${String(done)} von 4 erledigt`),
    });
  await expect(joghurt(2)).toHaveAttribute('aria-expanded', 'true');
  await expect(review.getByText(/92 kcal · Fett 2\.9 g · Zucker 12 g · Salz 0\.1 g/)).toBeVisible();
  await expect(review.getByText('Nutri-Score B')).toBeVisible();

  const yes = review.getByRole('button', { name: 'Ja, das ist Joghurt Mocca' });
  await expect(yes).toHaveAttribute('aria-pressed', 'false');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  // The open card fits a phone: nothing scrolls sideways.
  const widths = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  expect(widths[0]).toBeLessThanOrEqual(widths[1] ?? 0);
  await yes.click();
  await expect(yes).toHaveAttribute('aria-pressed', 'true');
  await expect(joghurt(3)).toBeVisible();

  // Step 2: the estimate is only a starting point; a date of your own counts.
  const date = review.getByLabel('Haltbar bis');
  await expect(review.getByText('geschätzt', { exact: true })).toBeVisible();
  await date.fill('24.12.2027');
  await expect(joghurt(4)).toBeVisible();
  await expect(review.getByText('Vollständig: 1 von 2 Artikeln')).toBeVisible();

  // Step 3: the place is prefilled and can be changed; the date estimate would follow it.
  await review.getByText('Tiefkühler', { exact: true }).click();
  await expect(review.getByLabel('Tiefkühler')).toBeChecked();

  // «Nein» drops a hit and offers the barcode instead; the step is open again.
  await review.getByRole('button', { name: 'Nein, das ist nicht Joghurt Mocca' }).click();
  await expect(review.getByText('Abgelehnt')).toBeVisible();
  await expect(review.getByText('Vollständig: 0 von 2 Artikeln')).toBeVisible();
  await review
    .getByRole('button', { name: 'Barcode scannen für Naturaplan Bio Joghurt Mocca 180g' })
    .click();
  await review.getByLabel('Nummer unter dem Strichcode').fill('7610000000004');
  await review.getByRole('button', { name: 'Übernehmen', exact: true }).click();
  await expect(review.getByText('Per Barcode')).toBeVisible();
  await expect(review.getByText('Vollständig: 1 von 2 Artikeln')).toBeVisible();

  // «Weiter» closes this card and opens the next incomplete one.
  await review.getByRole('button', { name: 'Weiter' }).click();
  await expect(joghurt(4)).toHaveAttribute('aria-expanded', 'false');
  const guacamole = review.getByRole('button', { name: /Guacamole Chunky.*2 von 4 erledigt/ });
  await expect(guacamole).toHaveAttribute('aria-expanded', 'true');

  // Guacamole had no hit: its barcode is scanned and counts as confirmed.
  await review.getByRole('button', { name: 'Barcode scannen für Guacamole Chunky' }).click();
  await review.getByLabel('Nummer unter dem Strichcode').fill('7613404000007');
  await review.getByRole('button', { name: 'Übernehmen', exact: true }).click();
  await expect(review.getByRole('button', { name: 'Ja, das ist Guacamole' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // Nothing is forced: the date stays an estimate and the import still works.
  await expect(review.getByText('Vollständig: 1 von 2 Artikeln')).toBeVisible();
  const after = await new AxeBuilder({ page }).analyze();
  expect(after.violations).toEqual([]);

  await review.getByRole('button', { name: '2 Artikel übernehmen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByText('Guacamole', { exact: true })).toBeVisible();
  // The yoghurt was moved to the freezer, so it is not on this tab.
  await expect(page.getByText('Joghurt Mocca', { exact: true })).toHaveCount(0);

  // The place chosen in the card is the tab the item lands in, with the date typed there.
  await page.goto('/inventory?location=freezer');
  await expect(page.getByText('Guacamole', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: /Joghurt Mocca/ }).click();
  await expect(page.getByText(/24\. Dez\. 2027/)).toBeVisible();
  await expect(page.getByText('(geschätzt)')).toHaveCount(0);
});
