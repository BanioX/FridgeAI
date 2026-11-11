import { AxeBuilder, expect, test } from './test';

/** «Wissen» instead of «Kochen» (ADR-0040, ADR-0041, ADR-0048): explanations and Haltbarkeit A–Z. */
test('explains the dates and finds how long a food keeps', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Wissen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Wissen' })).toBeVisible();
  await page.getByText('Zu verbrauchen bis', { exact: true }).click();
  await expect(page.getByText(/Nach diesem Datum nicht mehr verwenden/)).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByLabel('Lebensmittel suchen').fill('Pesto');
  const entry = page.getByText('Tomatenmark & Pesto');
  await expect(entry).toBeVisible();
  await expect(page.getByText(/offen etwa 5 Tage/)).toBeVisible();
  await expect(page.getByRole('img', { name: 'Haltbarkeit 9 von 10, robust' })).toBeVisible();
  await entry.click();
  await expect(page.getByText(/Reste löffelweise im Eiswürfelbehälter/)).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // The old tab «Kochen» lands on Start; an old recipe link follows to «Wissen» (ADR-0048).
  await page.goto('/cook');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/recipes/bananen-pancakes');
  await expect(page).toHaveURL(/\/knowledge\/recipes\/bananen-pancakes$/);
});
