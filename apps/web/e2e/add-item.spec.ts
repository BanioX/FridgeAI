import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('adds an item: the name suggests category, amount and unit', async ({ page }) => {
  await page.goto('/inventory');
  await page.getByRole('link', { name: 'Hinzufügen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Artikel erfassen' })).toBeVisible();

  // Saving without a name explains what is missing.
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByText('Bitte gib an, was es ist.')).toBeVisible();

  await page.getByLabel('Was ist es?').fill('Grana Padano');
  await expect(page.getByLabel('Kategorie')).toHaveValue('dairy-cheese-hard');
  await expect(page.getByLabel('Menge')).toHaveValue('300');
  await expect(page.getByLabel('Einheit')).toHaveValue('g');
  await expect(page.getByRole('radio', { name: 'Kühlschrank' })).toBeChecked();

  const form = await new AxeBuilder({ page }).analyze();
  expect(form.violations).toEqual([]);

  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByText('Grana Padano')).toBeVisible();
  await expect(page.getByText('300 g · Kühlschrank')).toBeVisible();
});

test('adds eggs by pack size and keeps the form open for the next item', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Freilandeier');
  await page.getByRole('button', { name: '10er' }).click();
  await expect(page.getByLabel('Menge')).toHaveValue('10');
  await expect(page.getByLabel('Verpackung')).toHaveValue('box');

  await page.getByRole('button', { name: 'Speichern und nächsten erfassen' }).click();
  // The form's own status line (quick add has one too, once something was added).
  await expect(page.getByRole('status').filter({ hasText: 'Freilandeier' })).toHaveText(
    'Freilandeier ist gespeichert.',
  );
  await expect(page.getByLabel('Was ist es?')).toHaveValue('');
  await expect(page.getByLabel('Was ist es?')).toBeFocused();

  await page.goto('/inventory');
  await expect(page.getByText('10 Stk. · Kühlschrank')).toBeVisible();
});
