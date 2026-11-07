import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';

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
  const field = page.getByLabel('Was ist es?');
  // Two letters stay on the device.
  await field.fill('Co');
  await page.waitForTimeout(900);
  expect(searches).toEqual([]);
  // While typing nothing is sent; once typing pauses, one search goes out (ADR-0025).
  await field.pressSequentially('op Gipfeli', { delay: 40 });
  const more = page.getByRole('region', { name: 'Gefundene Produkte' });
  const hit = more.getByRole('button', { name: /Gipfeli.*Coop · 180 g/ });
  await expect(hit).toBeVisible();
  expect(searches).toHaveLength(1);
  expect(searches[0]).toContain('search_terms=Coop%20Gipfeli');
  expect(searches[0]).toContain('tag_0=switzerland');
  await expect(page.getByText('Daten: Open Food Facts (Schweiz).')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await hit.click();
  await expect(page.getByLabel('Was ist es?')).toHaveValue('Gipfeli');
  await expect(page.getByText(/Übernommen: Gipfeli\./)).toBeVisible();
  await expect(page.getByLabel('Menge')).toHaveValue('180');
  await expect(page.getByRole('link', { name: 'Daten: Open Food Facts (ODbL)' })).toBeVisible();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('link', { name: /Gipfeli/ })).toBeVisible();
  await page.goto('/inventory/new');

  // Next time it shows up at once under «Bereits verwendet», and only there.
  await field.fill('gipf');
  const used = page.getByRole('region', { name: 'Bereits verwendet' });
  await expect(used.getByRole('button', { name: /Gipfeli/ })).toBeVisible();
  await expect.poll(() => searches.length).toBe(2);
  await expect(page.getByRole('status').filter({ hasText: 'Suche' })).toHaveCount(0);
  await expect(more).toHaveCount(0);
  await used.getByRole('button', { name: /Gipfeli/ }).click();
  await expect(page.getByLabel('Was ist es?')).toHaveValue('Gipfeli');
  await expect(page.getByRole('region', { name: 'Bereits verwendet' })).toHaveCount(0);
});

test('says so when the search is unavailable and keeps manual entry open', async ({ page }) => {
  const searches: string[] = [];
  await page.route(SEARCH, (route) => {
    searches.push(route.request().url());
    return route.fulfill({ status: 429, body: 'Too many requests' });
  });
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Weggli');
  await expect(page.getByText(/Die Produktsuche ist gerade nicht erreichbar/)).toBeVisible();
  // Typing on does not keep asking; «Nochmals suchen» does.
  await page.getByLabel('Was ist es?').fill('Weggli Coop');
  await page.waitForTimeout(900);
  await expect(page.getByText(/Die Produktsuche ist gerade nicht erreichbar/)).toBeVisible();
  expect(searches).toHaveLength(1);
  await page.getByRole('button', { name: 'Nochmals suchen' }).click();
  await expect.poll(() => searches.length).toBe(2);
  await expect(page.getByText(/Die Produktsuche ist gerade nicht erreichbar/)).toBeVisible();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('link', { name: /Weggli Coop/ })).toBeVisible();
});
