import type { Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

async function addToFridge(page: Page, name: string) {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill(name);
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
}

test('weekly fridge check: half, thrown away, back, still there', async ({ page }) => {
  await addToFridge(page, 'Grana Padano');
  await addToFridge(page, 'Vollmilch');

  await page.goto('/');
  await page.getByRole('link', { name: 'Check starten' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Kühlschrank-Check' })).toBeVisible();
  await expect(page.getByText('1 von 2')).toBeVisible();
  const check = await new AxeBuilder({ page }).analyze();
  expect(check.violations).toEqual([]);

  // Soonest date first: the milk, then the hard cheese.
  await expect(page.getByRole('heading', { level: 2, name: 'Vollmilch' })).toBeVisible();
  await page.getByRole('button', { name: 'Entsorgt' }).click();

  await expect(page.getByRole('heading', { level: 2, name: 'Grana Padano' })).toBeFocused();
  await expect(page.getByText('2 von 2')).toBeVisible();
  // A mistake: «Zurück» undoes the waste and asks for the milk again.
  await page.getByRole('button', { name: 'Zurück', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Vollmilch' })).toBeFocused();
  await page.getByRole('button', { name: 'Noch da' }).click();
  await page.getByRole('button', { name: 'Halb' }).click();

  await expect(
    page.getByRole('heading', { name: 'Fertig, dein Kühlschrank ist aktuell.' }),
  ).toBeVisible();
  await expect(page.getByText('1 noch da, 1 halb')).toBeVisible();

  // Half of 300 g cheese is left, the milk is untouched, and the card waits a week.
  await page.getByRole('link', { name: 'Zum Start' }).click();
  await expect(page.getByRole('link', { name: 'Check starten' })).toHaveCount(0);
  await page.goto('/inventory?location=fridge');
  await expect(page.getByRole('link', { name: /Grana Padano/ })).toContainText('150 g');
  await expect(page.getByRole('link', { name: /Vollmilch/ })).toBeVisible();
});

test('the check can be started any time from «Mehr»', async ({ page }) => {
  await page.goto('/more');
  const entry = page.getByRole('link', { name: /Kühlschrank-Check/ });
  await expect(entry).toContainText('Noch nie');
  await entry.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Kühlschrank-Check' })).toBeVisible();
});

test('says so when the fridge is empty', async ({ page }) => {
  await page.goto('/check');
  await expect(page.getByText('Im Kühlschrank liegt nichts.', { exact: false })).toBeVisible();
});
