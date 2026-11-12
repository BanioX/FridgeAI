import { AxeBuilder, expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

/**
 * «Klimabilanz» (ADR-0057): a rescue shows up on Start as one line with CO₂e, and the full view
 * has the four tiles, the chart, the Kehricht estimate and the source line. Written, not run by
 * the author: the dispatcher runs the e2e suite.
 */
test('a rescue shows the Klimabilanz on Start and in the full view', async ({ page }) => {
  const today = new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  // Nothing rescued yet: no card on Start.
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Start' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Klimabilanz' })).toHaveCount(0);

  // Yoghurt on its last day, rescued (flow of rescue.spec.ts).
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Joghurt');
  await page.getByLabel('Haltbar bis').fill(today);
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Joghurt/ }).click();
  await page.locator('label').filter({ hasText: 'Ja, gerettet' }).click();
  await page.getByRole('button', { name: 'Als verwertet speichern' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Gerettet:' })).toBeVisible();

  // Start: one compact card with weight, CO₂e and water, and a link.
  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { name: 'Klimabilanz' })).toBeVisible();
  await expect(page.getByText(/^Diesen Monat gerettet:/)).toBeVisible();
  await expect(page.getByText(/ kg CO₂e · .* l Wasser| g CO₂e · .* l Wasser/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  // The full view: four tiles, chart, Kehricht (CHF household), method and sources.
  await page.getByRole('link', { name: 'Klimabilanz ansehen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Klimabilanz' })).toBeVisible();
  const tiles = page.getByRole('region', { name: 'Gerettet', exact: true });
  for (const metric of ['Lebensmittel', 'CO₂e', 'Wasser', 'Fläche']) {
    await expect(tiles.getByText(metric, { exact: true })).toBeVisible();
  }
  await expect(
    page.getByRole('img', { name: /^Gerettet und entsorgt im Vergleich: / }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kehricht' })).toBeVisible();
  await expect(page.getByText(/Säcken à 35 Liter/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'So rechnet Rettich' })).toBeVisible();
  await expect(
    page.getByText('Daten: Clark et al. (2022), PNAS, via Our World in Data, CC BY 4.0'),
  ).toBeVisible();
  await expect(page.getByText(/klimaneutral/i)).toHaveCount(0);

  // «Seit Beginn» works too.
  await page.getByText('Seit Beginn', { exact: true }).click();
  await expect(tiles.getByText('CO₂e', { exact: true })).toBeVisible();

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  // Mehr lists it, too.
  await page.getByRole('link', { name: 'Mehr', exact: true }).first().click();
  await expect(page.getByRole('link', { name: /Klimabilanz/ })).toBeVisible();
});
