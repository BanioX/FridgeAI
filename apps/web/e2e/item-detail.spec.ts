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
  await expect(page.getByText('Grana Padano')).toHaveCount(0);

  // The start page now shows the month's impact: a third saved, the rest wasted.
  const cspErrors: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) {
      cspErrors.push(message.text());
    }
  });
  await page.getByRole('navigation').getByRole('link', { name: 'Heute' }).click();
  await expect(page.getByRole('heading', { name: 'Deine Wirkung diesen Monat' })).toBeVisible();
  await expect(page.getByRole('img', { name: '33 % gerettet' })).toBeVisible();
  const today = await new AxeBuilder({ page }).analyze();
  expect(today.violations).toEqual([]);
  expect(cspErrors).toEqual([]);
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
