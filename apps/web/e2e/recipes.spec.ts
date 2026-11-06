import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('suggests a recipe for milk that expires tomorrow and puts the rest on the list', async ({
  page,
}) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Vollmilch');
  await page.getByRole('button', { name: 'morgen', exact: true }).click();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('link', { name: /Vollmilch/ })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Rezeptideen' })).toBeVisible();
  // Every idea rescues the milk; which recipes come first depends on the collection.
  const ideas = page.getByRole('region', { name: 'Rezeptideen' }).getByRole('link');
  await expect(ideas.first()).toContainText('Rettet Vollmilch');
  await ideas.first().click();
  await expect(page.getByText('Da: Vollmilch')).toBeVisible();

  await page.goto('/recipes/bananen-pancakes');

  await expect(page.getByRole('heading', { level: 1, name: 'Bananen-Pancakes' })).toBeVisible();
  await expect(page.getByText('Da: Vollmilch')).toBeVisible();
  const recipe = await new AxeBuilder({ page }).analyze();
  expect(recipe.violations).toEqual([]);

  // Bananas and eggs are missing; flour and salt are staples.
  await page.getByRole('button', { name: '2 fehlende Zutaten auf die Liste' }).click();
  await expect(page.getByText('2 Zutaten sind auf der Einkaufsliste.')).toBeVisible();
  await page.goto('/shopping');
  await expect(page.getByText('2 reife Bananen')).toBeVisible();
  await expect(page.getByText('2 Eier')).toBeVisible();
});

test('says so for a recipe that does not exist', async ({ page }) => {
  await page.goto('/recipes/gibt-es-nicht');
  await expect(page.getByText('Dieses Rezept gibt es nicht (mehr).')).toBeVisible();
});
