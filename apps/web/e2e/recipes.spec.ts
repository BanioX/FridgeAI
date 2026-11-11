import type { Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

const addFood = async (page: Page, name: string, tomorrow: boolean) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill(name);
  if (tomorrow) {
    await page.getByRole('button', { name: 'morgen', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
};

test('suggests a recipe under «Wissen» for milk that expires tomorrow and lists the rest', async ({
  page,
}) => {
  await addFood(page, 'Vollmilch', true);

  await page.goto('/knowledge');
  const recipes = page.getByRole('region', { name: 'Rezepte' });
  await expect(recipes.getByRole('heading', { name: 'Heute kochen' })).toBeVisible();
  // Every idea rescues the milk; which recipes come first depends on the collection.
  const ideas = recipes.getByRole('link').filter({ hasText: 'Rettet Vollmilch' });
  await expect(ideas.first()).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto('/knowledge/recipes/bananen-pancakes');
  await expect(page.getByRole('heading', { level: 1, name: 'Bananen-Pancakes' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Da', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Fehlt', exact: true })).toBeVisible();
  await expect(page.getByText('Da: Vollmilch')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // Bananas and eggs are missing; flour and salt are staples.
  await page.getByRole('button', { name: 'Fehlendes auf die Liste' }).click();
  await expect(page.getByText('2 Sachen auf der Liste.')).toBeVisible();
  await page.goto('/shopping');
  await expect(page.getByText('2 reife Bananen')).toBeVisible();
  await expect(page.getByText('2 Eier')).toBeVisible();

  // A second tap adds nothing new.
  await page.goto('/knowledge/recipes/bananen-pancakes');
  await page.getByRole('button', { name: 'Fehlendes auf die Liste' }).click();
  await expect(page.getByText('Das steht schon alles auf der Liste.')).toBeVisible();
});

test('opens «Alle Rezepte» from «Wissen» and goes back', async ({ page }) => {
  await page.goto('/knowledge');
  const recipes = page.getByRole('region', { name: 'Rezepte' });
  // Nothing expires: «Heute kochen» says so.
  await expect(page.getByText(/^Gerade läuft nichts bald ab/)).toBeVisible();
  await recipes.getByRole('link', { name: /Alle Rezepte/ }).click();
  await expect(page).toHaveURL(/\/knowledge\/recipes$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Alle Rezepte' })).toBeVisible();
  const entry = page.getByRole('link', { name: /Bananen-Pancakes/ });
  await expect(entry).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await entry.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Bananen-Pancakes' })).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Wissen' }).click();
  await expect(page).toHaveURL(/\/knowledge$/);
});

test('says so for a recipe that does not exist', async ({ page }) => {
  await page.goto('/knowledge/recipes/gibt-es-nicht');
  await expect(page.getByText('Dieses Rezept gibt es nicht (mehr).')).toBeVisible();
});

test('writes an own recipe, opens it and finds it under «Meine Rezepte»', async ({ page }) => {
  await page.goto('/knowledge');
  const recipes = page.getByRole('region', { name: 'Rezepte' });
  await recipes.getByRole('link', { name: /Rezept hinzufügen/ }).click();
  await expect(page).toHaveURL(/\/knowledge\/recipes\/new$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Neues Rezept' })).toBeVisible();

  await page.getByLabel('Titel').fill('Milchreis');
  await page.getByLabel('Minuten').fill('40');
  await page.getByLabel('Portionen').fill('2');
  // A recipe copied from somewhere else: bullets and numbers go, empty lines too.
  await page.getByLabel('Zutaten', { exact: true }).fill('• 1 l Milch\n\n2. 200 g Reis\n- Zimt');
  await page.getByLabel('Schritte', { exact: true }).fill('1. Milch erwärmen.\n2. Reis dazugeben.');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Milchreis' })).toBeVisible();
  await expect(page.getByText('40 Min. · 2 Portionen')).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Fehlt', exact: true })).toBeVisible();
  await expect(page.getByText('200 g Reis')).toBeVisible();
  await expect(page.getByText('Reis dazugeben.')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto('/knowledge/recipes');
  await expect(page.getByRole('heading', { level: 2, name: 'Meine Rezepte' })).toBeVisible();
  // The curated «Milchreis mit Zimt» is listed too; the own one has 40 minutes.
  await page.getByRole('link', { name: /^Milchreis 40 Min/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Milchreis' })).toBeVisible();

  // Delete asks first, on the page itself.
  await page.getByRole('button', { name: 'Löschen', exact: true }).click();
  await page.getByRole('button', { name: 'Ja, löschen' }).click();
  await expect(page).toHaveURL(/\/knowledge\/recipes$/);
  await expect(page.getByRole('link', { name: /^Milchreis 40 Min/ })).toHaveCount(0);
});
