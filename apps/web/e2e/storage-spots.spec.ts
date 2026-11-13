import { AxeBuilder, expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

/** An 8×6 pixel green PNG with valid checksums: no real photo in the repo. */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAEUlEQVR42mMQiXPCihgGUgIA270hwa7lp5MAAAAASUVORK5CYII=',
  'base64',
);

test('keeps where the sugar lies: spot with photo, in the row, searchable, with its own page', async ({
  page,
}) => {
  // «Kristallzucker» lands in the pantry («Vorrat»).
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Kristallzucker');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await page.getByRole('link', { name: /Kristallzucker/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Kristallzucker' })).toBeVisible();

  // «Platz festhalten» → «Neuer Platz»: the name is enough, the photo is a bonus.
  await page.getByRole('button', { name: 'Platz festhalten' }).click();
  const sheet = page.getByRole('dialog', { name: 'Wo liegt das?' });
  await sheet.getByRole('button', { name: 'Neuer Platz' }).click();
  await sheet.getByLabel('Name').fill('Oberer Schrank links');
  await sheet.getByLabel('Foto aufnehmen').setInputFiles({
    name: 'schrank.png',
    mimeType: 'image/png',
    buffer: TINY_PNG,
  });
  await expect(sheet.getByRole('img', { name: 'Vorschau des Fotos' })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Foto entfernen' })).toBeVisible();
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();

  // On the item page and in the Vorrat row.
  await expect(page.getByText('Oberer Schrank links', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Zurück zum Vorrat' }).click();
  await expect(
    page.getByRole('link', { name: /Kristallzucker.*Oberer Schrank links/ }),
  ).toBeVisible();

  // «Wo ist was?»: search «Zucker» and see the spot.
  await page.goto('/more');
  await page.getByRole('link', { name: /Wo ist was\?/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Wo ist was?' })).toBeVisible();
  await page.getByLabel('Was suchst du?').fill('Zucker');
  await expect(page).toHaveURL(/\/more\/spots\?q=Zucker$/);
  await expect(
    page.getByRole('link', { name: /Kristallzucker.*Oberer Schrank links/ }),
  ).toBeVisible();

  // The spot name finds the item that lies there, too.
  await page.getByLabel('Was suchst du?').fill('Oberer Schrank');
  await expect(
    page.getByRole('link', { name: /Kristallzucker.*Oberer Schrank links/ }),
  ).toBeVisible();

  // The address works as a shortcut target.
  await page.goto('/more/spots?q=zucker');
  await expect(page.getByLabel('Was suchst du?')).toHaveValue('zucker');
  await expect(page.getByRole('link', { name: /Kristallzucker/ })).toBeVisible();

  // The spot's own page shows the large photo and what lies there now.
  await page.getByRole('link', { name: /Oberer Schrank links.*1 Artikel/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Oberer Schrank links' })).toBeVisible();
  // A tap shows the photo over the whole screen (ADR-0082); «Schliessen» brings the page back.
  await page.getByRole('button', { name: 'Foto «Oberer Schrank links» gross anzeigen' }).click();
  const viewer = page.getByRole('dialog', { name: 'Oberer Schrank links' });
  await expect(viewer.getByRole('img', { name: 'Oberer Schrank links' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await viewer.getByRole('button', { name: 'Schliessen' }).click();
  await expect(viewer).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Kristallzucker/ })).toBeVisible();

  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);

  // Deleting asks first and says that the products only lose the spot.
  await page.getByRole('button', { name: 'Platz löschen' }).click();
  await expect(page.getByText(/Die Artikel bleiben, sie verlieren nur diesen Platz/)).toBeVisible();
  await page.getByRole('button', { name: 'Ja, löschen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Wo ist was?' })).toBeVisible();
  await expect(page.getByText('Noch keine Plätze.')).toBeVisible();
});

test('the page «Wo ist was?» is lean on an empty device and passes axe', async ({ page }) => {
  await page.goto('/more/spots');
  await expect(page.getByText(/tippe auf «Platz festhalten»/)).toBeVisible();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);
});

test('in the fridge, the compartment that suits the food is one tap away', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Hackfleisch');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Hackfleisch/ }).click();
  await page.getByRole('button', { name: 'Platz festhalten' }).click();
  const sheet = page.getByRole('dialog', { name: 'Wo liegt das?' });
  const shelves = sheet.getByRole('region', { name: 'Fächer im Kühlschrank' });
  // Meat keeps best at the bottom above the vegetable drawer, so that one comes first.
  await expect(shelves.getByRole('button').first()).toHaveText('Unteres Fach · passt hierhin');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await shelves.getByRole('button', { name: /Unteres Fach/ }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByText('Unteres Fach', { exact: true })).toBeVisible();
});
