import { AxeBuilder, expect, test } from './test';

test('adds a usual product with one tap and takes it back', async ({ page }) => {
  // Quick add lives on the Erfassen hub, not in the add form.
  await page.goto('/add');
  // Nothing added yet: no quick add.
  await expect(page.getByRole('heading', { name: 'Schnell erfassen' })).toHaveCount(0);

  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Vollmilch');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();

  await page.goto('/add');
  const milk = page.getByRole('button', { name: 'Vollmilch 1 l erfassen' });
  await expect(milk).toBeVisible();
  const form = await new AxeBuilder({ page }).analyze();
  expect(form.violations).toEqual([]);

  await milk.click();
  await expect(page.getByText('Vollmilch ist gespeichert: 1 l, Kühlschrank.')).toBeVisible();
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByText('Vollmilch wieder entfernt.')).toBeVisible();

  await milk.click();
  await expect(page.getByText('Vollmilch ist gespeichert: 1 l, Kühlschrank.')).toBeVisible();
  await page.goto('/inventory?location=fridge');
  // The first one from the form and the one from the second tap; the undone one is gone.
  await expect(page.getByRole('link', { name: /Vollmilch/ })).toHaveCount(2);
});
