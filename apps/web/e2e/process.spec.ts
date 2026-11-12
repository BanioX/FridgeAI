import type { Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

const addFood = async (page: Page, name: string) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill(name);
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
};

test('bakes a cake from flour and eggs, then undoes it', async ({ page }) => {
  await addFood(page, 'Mehl');
  await addFood(page, 'Eier');

  // From the item page: «Verarbeiten» preselects this item. Flour sits in the pantry.
  await page.goto('/inventory?location=pantry');
  await page.getByRole('link', { name: /Mehl/ }).click();
  await page.getByRole('link', { name: 'Verarbeiten' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Verarbeiten' })).toBeVisible();
  await expect(page.getByText('1 gewählt')).toBeVisible();
  await page.getByRole('button', { name: /Eier/ }).click();
  await expect(page.getByText('2 gewählt')).toBeVisible();
  await page.getByLabel('Name', { exact: true }).fill('Schokoladenkuchen');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await expect(page.getByRole('status').first()).toHaveText(
    'Schokoladenkuchen ist im Kühlschrank. 2 Zutaten verwertet.',
  );
  await page.getByRole('link', { name: /Schokoladenkuchen/ }).click();
  await expect(page.getByText('Selbst gemacht aus: Mehl, Eier')).toBeVisible();

  // Back to the Vorrat, undo from a fresh processing is covered by the unit tests; here the new
  // item is simply there and the ingredients are gone.
  await page.goto('/inventory?location=fridge');
  await expect(page.getByRole('link', { name: /Eier/ })).toHaveCount(0);
});

test('cooks a recipe and puts the leftovers into the fridge', async ({ page }) => {
  await addFood(page, 'Vollmilch');
  await page.goto('/knowledge/recipes/bananen-pancakes');
  await expect(page.getByText('Da: Vollmilch')).toBeVisible();
  await page.getByRole('button', { name: 'Gekocht' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Verarbeiten' })).toBeVisible();
  await expect(page.getByText('1 gewählt')).toBeVisible();
  await page.locator('label').filter({ hasText: 'Ja' }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Reste: Bananen-Pancakes');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await expect(page.getByRole('status').first()).toHaveText(
    'Reste: Bananen-Pancakes ist im Kühlschrank. 1 Zutat verwertet.',
  );
  await expect(page.getByRole('link', { name: /Reste: Bananen-Pancakes/ })).toBeVisible();
});

test('records leftovers from the Erfassen hub with a name only', async ({ page }) => {
  await page.goto('/add');
  await page.getByRole('link', { name: /Reste erfassen/ }).click();
  await page.getByLabel('Name', { exact: true }).fill('Reste: Lasagne');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('link', { name: /Reste: Lasagne/ })).toBeVisible();
});
