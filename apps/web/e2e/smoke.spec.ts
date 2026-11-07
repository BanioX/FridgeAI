import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';

test('shell renders, navigates and has no a11y violations', async ({ page }) => {
  // Fails the test on anything the Content-Security-Policy from public/_headers blocks.
  const cspViolations: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Content Security Policy')) {
      cspViolations.push(message.text());
    }
  });

  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");
  await expect(page.getByRole('heading', { level: 1, name: 'Heute retten' })).toBeVisible();
  await expect(page.locator('head link[rel="manifest"]')).toHaveCount(1);

  const home = await new AxeBuilder({ page }).analyze();
  expect(home.violations).toEqual([]);

  await page.getByRole('navigation').getByRole('link', { name: 'Vorrat' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByRole('tablist')).toBeVisible();

  const inventory = await new AxeBuilder({ page }).analyze();
  expect(inventory.violations).toEqual([]);
  expect(cspViolations).toEqual([]);
});

test('production build ships no developer tools', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Beispieldaten laden' })).toHaveCount(0);
  await page.goto('/styleguide');
  await expect(page.getByRole('heading', { level: 1, name: 'Seite nicht gefunden' })).toBeVisible();
});

test('home screen icons for iPhone and Android are there', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/apple-touch-icon.png',
  );
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = (await (await request.get(manifestUrl ?? '')).json()) as {
    icons: { src: string; sizes: string; purpose: string }[];
  };
  expect(manifest.icons.map((icon) => `${icon.sizes} ${icon.purpose}`)).toEqual(
    expect.arrayContaining(['192x192 any', '512x512 any', '512x512 maskable']),
  );
  for (const file of ['/apple-touch-icon.png', ...manifest.icons.map((icon) => `/${icon.src}`)]) {
    const response = await request.get(file);
    expect(response.ok(), file).toBe(true);
  }
});
