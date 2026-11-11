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
  await page.getByRole('button', { name: 'Auf die Liste' }).click();
  await expect(page.getByRole('status')).toHaveText(
    /^Milch ist auf der Liste\. Du hast noch 1 l Bio Vollmilch \(bis .+\)\.$/,
  );
  await expect(page.getByText(/^Noch da: 1 l, bis/)).toBeVisible();
  await what.fill('milch');
  await page.getByRole('button', { name: 'Auf die Liste' }).click();
  await expect(page.getByRole('status')).toContainText('Milch steht schon auf der Liste.');

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

test('shopping list: one sentence becomes one entry per product', async ({ page }) => {
  await page.goto('/shopping');
  await page
    .getByLabel('Was brauchst du?')
    .fill('Milch, 2 Joghurt, ein Brot und 500 g Hackfleisch sowie Eier');
  await page.getByRole('button', { name: 'Auf die Liste' }).click();
  await expect(page.getByRole('status')).toHaveText('5 Sachen auf der Liste.');
  for (const item of ['Milch', 'Joghurt', 'Brot', 'Hackfleisch', 'Eier']) {
    await expect(page.getByRole('checkbox', { name: new RegExp(item) })).toBeVisible();
  }
  await expect(page.getByRole('checkbox', { name: /Hackfleisch.*500 g/ })).toBeVisible();
  await expect(page.getByLabel('Was brauchst du?')).toHaveValue('');
});

test('shopping list: hints at often thrown-away food and shares the list as text', async ({
  page,
}) => {
  for (const name of ['Hummus Natur', 'Tzatziki']) {
    await page.goto('/inventory/new');
    await page.getByLabel('Was ist es?').fill(name);
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await page.getByRole('link', { name: new RegExp(name) }).click();
    await page.locator('label').filter({ hasText: 'Entsorgt' }).click();
    await page.getByRole('button', { name: 'Als entsorgt speichern' }).click();
    await expect(page.getByRole('status')).toHaveText(`${name}: als entsorgt gespeichert.`);
  }

  await page.goto('/shopping');
  await expect(page.getByRole('button', { name: 'Liste teilen' })).toHaveCount(0);
  await page.getByLabel('Was brauchst du?').fill('Guacamole, Milch');
  await page.getByRole('button', { name: 'Auf die Liste' }).click();
  await expect(page.getByText(/^Entsorgst du oft\./)).toHaveCount(1);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // No Web Share in desktop Chromium: the list goes to the clipboard.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });
  await page.getByRole('button', { name: 'Liste teilen' }).click();
  await expect(page.getByRole('status')).toHaveText('Kopiert.');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe('Nachkaufen\nGuacamole\nMilch');
});
