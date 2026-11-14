import type { Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

interface Manifest {
  shortcuts: { name: string; url: string }[];
  share_target: { action: string; method: string; params: Record<string, string> };
}

async function manifestOf(page: Page) {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  return (await (await page.request.get(href ?? '')).json()) as Manifest;
}

test('a link fills the shopping list, one tap adds it, the address is cleaned', async ({
  page,
}) => {
  await page.goto(`/shopping?add=${encodeURIComponent('Milch, 2 Joghurt und Brot')}`);
  const field = page.getByLabel('Was brauchst du?');
  await expect(field).toHaveValue('Milch, 2 Joghurt und Brot');
  await expect(page.getByRole('status')).toHaveText(
    'Übernommen. Prüf den Text und tipp auf «Auf die Liste».',
  );
  // Nothing is added without the tap: a link alone never changes the list.
  await expect(page.getByText('Deine Liste ist leer. Was fehlt dir?')).toBeVisible();
  await expect(page).toHaveURL(/\/shopping$/);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole('button', { name: 'Auf die Liste' }).click();
  await expect(page.getByRole('status')).toHaveText('3 Sachen auf der Liste.');
  await expect(page.getByRole('checkbox', { name: /Joghurt/ })).toBeVisible();

  // A reload does not fill the field a second time.
  await page.reload();
  await expect(page.getByLabel('Was brauchst du?')).toHaveValue('');
});

test('the share target hands shared text to the shopping list', async ({ page }) => {
  const { share_target: share } = await manifestOf(page);
  expect(share).toEqual({
    action: '/shopping',
    method: 'GET',
    params: { title: 'title', text: 'text', url: 'url' },
  });
  const query = new URLSearchParams({
    [share.params.title ?? 'title']: 'Einkauf',
    [share.params.text ?? 'text']: 'Butter\nEier',
    [share.params.url ?? 'url']: 'https://example.org/liste',
  });
  await page.goto(`${share.action}?${query.toString()}`);
  await expect(page.getByLabel('Was brauchst du?')).toHaveValue('Butter\nEier');
});

test('each home screen shortcut opens a page of the app', async ({ page }) => {
  const { shortcuts } = await manifestOf(page);
  expect(shortcuts.map((shortcut) => shortcut.url)).toEqual([
    '/shopping',
    '/add/receipt',
    '/add',
    '/check',
  ]);
  for (const { url } of shortcuts) {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 }), url).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Seite nicht gefunden' })).toHaveCount(
      0,
    );
  }
});
