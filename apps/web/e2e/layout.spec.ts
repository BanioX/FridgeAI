import { expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

test('no page scrolls sideways on a phone, even with a long «Schnell erfassen» row', async ({
  page,
}) => {
  // Enough products with long names that the quick-add chips run past the screen edge.
  for (const name of [
    'Griechischer Joghurt',
    'Mozzarella di Bufala',
    'Gruyère AOP rezent',
    'Vollmilch',
  ]) {
    await page.goto('/inventory/new');
    await page.getByLabel('Was ist es?').fill(name);
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  }

  const routes = [
    '/',
    '/inventory',
    '/add',
    '/knowledge',
    '/more',
    '/more/reports',
    '/more/history',
    '/more/data',
    '/shopping',
  ];
  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const { scroll, width } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    expect(scroll, `${route} is ${String(scroll)} px wide`).toBeLessThanOrEqual(width);
  }
});
