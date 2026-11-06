import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Open Food Facts is never called for real in tests.
const SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl**';
const PRODUCT = 'https://world.openfoodfacts.org/api/v2/product/**';

test('finds «Coop Gipfeli» by name and fills in the form like a scan', async ({ page }) => {
  const searches: string[] = [];
  await page.route(SEARCH, (route) => {
    searches.push(route.request().url());
    return route.fulfill({
      json: {
        count: 1,
        products: [
          { code: '7610000000004', product_name_de: 'Gipfeli', brands: 'Coop', quantity: '180 g' },
        ],
      },
    });
  });
  await page.route(PRODUCT, (route) =>
    route.fulfill({
      json: {
        status: 1,
        product: { product_name_de: 'Gipfeli', brands: 'Coop', quantity: '180 g' },
      },
    }),
  );

  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Coop Gipfeli');
  // Nothing is sent while typing.
  expect(searches).toEqual([]);
  await page.getByRole('button', { name: '«Coop Gipfeli» suchen' }).click();
  const hit = page.getByRole('button', { name: /Gipfeli.*Coop · 180 g/ });
  await expect(hit).toBeVisible();
  expect(searches).toHaveLength(1);
  expect(searches[0]).toContain('search_terms=Coop%20Gipfeli');
  expect(searches[0]).toContain('tag_0=switzerland');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await hit.click();
  await expect(page.getByLabel('Was ist es?')).toHaveValue('Gipfeli');
  await expect(page.getByText(/Übernommen: Gipfeli\./)).toBeVisible();
  await expect(page.getByLabel('Menge')).toHaveValue('180');
  await expect(page.getByRole('link', { name: 'Daten: Open Food Facts (ODbL)' })).toBeVisible();
  await page.getByRole('button', { name: 'Speichern und nächsten erfassen' }).click();
  await expect(page.getByText('Gipfeli ist gespeichert.')).toBeVisible();

  // Next time it shows up while typing under «Bereits verwendet», without asking the internet.
  await page.getByLabel('Was ist es?').fill('gipf');
  const used = page.getByRole('region', { name: 'Bereits verwendet' });
  await expect(used.getByRole('button', { name: /Gipfeli/ })).toBeVisible();
  expect(searches).toHaveLength(1);
  await used.getByRole('button', { name: /Gipfeli/ }).click();
  await expect(page.getByLabel('Was ist es?')).toHaveValue('Gipfeli');
  await expect(page.getByRole('region', { name: 'Bereits verwendet' })).toHaveCount(0);
});

test('says so when the search is unavailable and keeps manual entry open', async ({ page }) => {
  await page.route(SEARCH, (route) => route.fulfill({ status: 429, body: 'Too many requests' }));
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Weggli');
  await page.getByRole('button', { name: '«Weggli» suchen' }).click();
  await expect(page.getByText(/Die Produktsuche ist gerade nicht erreichbar/)).toBeVisible();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('link', { name: /Weggli/ })).toBeVisible();
});
