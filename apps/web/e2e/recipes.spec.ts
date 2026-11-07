import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';

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

  // The «Kochen» tab: back from the recipe, the same rescue ideas, more of them.
  await page.getByRole('main').getByRole('link', { name: 'Kochen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Kochen' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Rezepte' }).getByRole('link').first(),
  ).toContainText('Rettet Vollmilch');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto('/recipes/bananen-pancakes');

  await expect(page.getByRole('heading', { level: 1, name: 'Bananen-Pancakes' })).toBeVisible();
  await expect(page.getByText('Da: Vollmilch')).toBeVisible();
  const recipe = await new AxeBuilder({ page }).analyze();
  expect(recipe.violations).toEqual([]);

  // Bananas and eggs are missing; flour and salt are staples.
  await page.getByRole('button', { name: '2 fehlende Zutaten nachkaufen' }).click();
  await expect(page.getByText('2 Zutaten stehen bei «Nachkaufen».')).toBeVisible();
  await page.goto('/shopping');
  await expect(page.getByText('2 reife Bananen')).toBeVisible();
  await expect(page.getByText('2 Eier')).toBeVisible();
});

test('«Kochen» is one list: «Retten» says so when nothing expires, then «Feierabend» and «Alle»', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Kochen' }).click();
  const list = page.getByRole('region', { name: 'Rezepte' });
  await expect(page.getByText('Gerade läuft nichts bald ab. Schau bei «Alle» rein.')).toBeVisible();
  await expect(list.getByRole('link')).toHaveCount(0);
  // The old second list and the tag filters are gone.
  await expect(page.getByRole('heading', { name: 'Alle Rezepte' })).toHaveCount(0);
  await expect(page.locator('label').filter({ hasText: 'Vegan' })).toHaveCount(0);

  // «Feierabend»: at most 15 minutes and nothing to buy – with an empty fridge, nothing fits.
  await page.locator('label').filter({ hasText: 'Feierabend' }).click();
  await expect(page).toHaveURL(/\?filter=feierabend$/);
  await expect(list.getByRole('link')).toHaveCount(0);
  await expect(page.getByText(/^Für den Feierabend/)).toBeVisible();

  // «Alle» lists the whole collection.
  await page
    .locator('label')
    .filter({ hasText: /^Alle$/ })
    .click();
  await expect(page).toHaveURL(/\?filter=alle$/);
  await expect(list.getByRole('link', { name: /Bananen-Pancakes/ })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // The choice survives a reload because it lives in the URL.
  await page.reload();
  await expect(list.getByRole('link', { name: /Bananen-Pancakes/ })).toBeVisible();
});

test('says so for a recipe that does not exist', async ({ page }) => {
  await page.goto('/recipes/gibt-es-nicht');
  await expect(page.getByText('Dieses Rezept gibt es nicht (mehr).')).toBeVisible();
});

test('books what was cooked as eaten and takes it back', async ({ page }) => {
  const add = async (name: string, tomorrow: boolean) => {
    await page.goto('/inventory/new');
    await page.getByLabel('Was ist es?').fill(name);
    if (tomorrow) {
      await page.getByRole('button', { name: 'morgen', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
  };
  await add('Vollmilch', true);
  await add('Freilandeier', false);

  await page.goto('/recipes/bananen-pancakes');
  await page.getByRole('button', { name: 'Zutaten abbuchen' }).click();
  // The milk had to be rescued: «Alles»; the fresh eggs: «Nichts», a recipe needs only two.
  await expect(
    page.getByRole('group', { name: /^Vollmilch/ }).getByRole('radio', { name: 'Alles' }),
  ).toBeChecked();
  await expect(
    page.getByRole('group', { name: /^Freilandeier/ }).getByRole('radio', { name: 'Nichts' }),
  ).toBeChecked();
  const booking = await new AxeBuilder({ page }).analyze();
  expect(booking.violations).toEqual([]);

  await page.getByRole('button', { name: 'Abbuchen' }).click();
  await expect(page.getByText('1 Zutat als gegessen abgebucht.')).toBeVisible();
  await page.goto('/inventory?location=fridge');
  await expect(page.getByRole('link', { name: /Vollmilch/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Freilandeier/ })).toBeVisible();

  await page.goto('/recipes/bananen-pancakes');
  await page.getByRole('button', { name: 'Zutaten abbuchen' }).click();
  await page
    .getByRole('group', { name: /^Freilandeier/ })
    .locator('label', { hasText: 'Alles' })
    .click();
  await page.getByRole('button', { name: 'Abbuchen' }).click();
  await expect(page.getByText('1 Zutat als gegessen abgebucht.')).toBeVisible();
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByText('Rückgängig gemacht, alles ist wieder im Vorrat.')).toBeVisible();
  await page.goto('/inventory?location=fridge');
  await expect(page.getByRole('link', { name: /Freilandeier/ })).toBeVisible();
});
