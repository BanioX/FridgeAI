import { expect, test } from './test';

// The bug from the pilot: after an update the open app asks for an old page chunk; Cloudflare
// answers with index.html ('text/html' is not a valid JavaScript MIME type). The app must load the
// new version once instead of showing «Unexpected Application Error».
// The service worker would answer from its cache and hide the server's answer from the test.
test.use({ serviceWorkers: 'block' });

test('a page chunk gone after an update loads the new version instead of an error', async ({
  page,
}) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Apfel');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('link', { name: /Apfel/ })).toBeVisible();

  let answeredWithHtml = 0;
  await page.route(/\/assets\/ItemDetailPage-[\w-]+\.js$/, async (route) => {
    if (answeredWithHtml === 0) {
      answeredWithHtml += 1;
      await route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>x</title>' });
      return;
    }
    await route.continue();
  });

  await page.getByRole('link', { name: /Apfel/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Apfel' })).toBeVisible();
  await expect(page.getByText('Unexpected Application Error')).toHaveCount(0);
  expect(answeredWithHtml).toBe(1);
});
