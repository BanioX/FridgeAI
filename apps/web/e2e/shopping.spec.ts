import { AxeBuilder, expect, test } from './test';

test('shopping list: hints at food at home, checks off and puts it into the inventory', async ({
  page,
}) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Bio Vollmilch');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await page.getByRole('navigation').getByRole('link', { name: 'Mehr' }).click();
  await page.getByRole('link', { name: /^Nachkaufen/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Nachkaufen' })).toBeVisible();
  await expect(page.getByText('Deine Liste ist leer. Was fehlt dir?')).toBeVisible();

  const what = page.getByLabel('Was brauchst du?');
  await what.fill('Milch');
  await what.press('Enter');
  await expect(page.getByRole('status')).toHaveText(
    /^Milch ist auf der Liste\. Du hast noch 1 l Bio Vollmilch \(bis .+\)\.$/,
  );
  await expect(page.getByText(/^Noch da: 1 l, bis/)).toBeVisible();
  await what.fill('milch');
  await what.press('Enter');
  await expect(page.getByRole('status')).toContainText('milch steht schon auf der Liste.');

  await what.fill('Ruchbrot');
  await page.getByRole('button', { name: 'Auf die Liste' }).click();
  await expect(page.getByRole('status')).toHaveText('Ruchbrot ist auf der Liste.');
  const list = await new AxeBuilder({ page }).analyze();
  expect(list.violations).toEqual([]);

  // The box follows the stored state, so wait for the basket instead of the box itself.
  await page.getByRole('checkbox', { name: /Ruchbrot/ }).click();
  await expect(page.getByRole('heading', { name: 'Im Korb (1)' })).toBeVisible();
  await page.getByRole('link', { name: 'In den Vorrat legen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Artikel erfassen' })).toBeVisible();
  await expect(page.getByLabel('Was ist es?')).toHaveValue('Ruchbrot');

  await page.goto('/shopping');
  await page.getByRole('button', { name: 'Milch löschen' }).click();
  await expect(page.getByRole('checkbox', { name: /Milch/ })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: /Ruchbrot/ })).toBeChecked();
});
