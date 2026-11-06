import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Tap a chip the way people do: on its label (the radio itself is visually hidden). */
async function choose(page: Page, name: string) {
  await page.locator('label').filter({ hasText: name }).click();
  await expect(page.getByRole('radio', { name })).toBeChecked();
}

test('eats part of a cheese, opens it and throws the rest away with a reason', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Grana Padano');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await page.getByRole('link', { name: /Grana Padano/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Grana Padano' })).toBeVisible();
  // Hard cheese splits in thirds and quarters; «alles» is preselected.
  await expect(page.getByRole('radio', { name: 'alles' })).toBeChecked();
  await expect(page.getByRole('radio', { name: '⅓ · 100 g' })).toBeVisible();

  const detail = await new AxeBuilder({ page }).analyze();
  expect(detail.violations).toEqual([]);

  await page.getByRole('button', { name: 'Als geöffnet markieren' }).click();
  await expect(page.getByRole('status')).toContainText(/Geöffnet/);
  await expect(page.getByText(/^Geöffnet am/)).toBeVisible();

  await choose(page, '⅓ · 100 g');
  await page.getByRole('button', { name: 'Als gegessen speichern' }).click();
  await expect(page.getByRole('status')).toHaveText('Gespeichert. Noch 200 g übrig.');

  await choose(page, 'Weggeworfen');
  await choose(page, 'vergessen');
  await page.getByRole('button', { name: 'Als weggeworfen speichern' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Grana Padano/ })).toHaveCount(0);
});

test('a wrong tap can be undone, in part and in full', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Grana Padano');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Grana Padano/ }).click();

  await choose(page, '⅓ · 100 g');
  await page.getByRole('button', { name: 'Als gegessen speichern' }).click();
  await expect(page.getByRole('status')).toHaveText('Gespeichert. Noch 200 g übrig.');
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('status')).toHaveText('Rückgängig gemacht. Wieder 300 g da.');
  await expect(page.getByRole('button', { name: 'Rückgängig' })).toHaveCount(0);
  await expect(page.getByText('300 g · Kühlschrank')).toBeVisible();

  await choose(page, 'Weggeworfen');
  await page.getByRole('button', { name: 'Als weggeworfen speichern' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Grana Padano: als weggeworfen gespeichert.');
  await expect(page.getByRole('link', { name: /Grana Padano/ })).toHaveCount(0);
  const notice = await new AxeBuilder({ page }).analyze();
  expect(notice.violations).toEqual([]);

  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('status')).toHaveText('Grana Padano ist wieder im Vorrat.');
  await expect(page.getByRole('link', { name: /Grana Padano/ })).toBeVisible();
  await expect(page.getByText('300 g · Kühlschrank')).toBeVisible();
});

test('a free amount larger than what is left is refused', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Basmatireis');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Basmatireis/ }).click();

  await page.getByLabel(/Andere Menge/).fill('5000');
  await expect(page.getByText('Bitte eine Menge zwischen 0 und dem Rest angeben.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Als gegessen speichern' })).toBeDisabled();
});
