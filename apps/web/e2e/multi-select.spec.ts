import type { Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

async function addToFridge(page: Page, name: string) {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill(name);
  if (await page.getByLabel('Menge').isHidden()) {
    await page.getByText('Mehr Angaben').click();
  }
  await page.getByLabel('Menge').fill('2');
  await page.getByLabel('Einheit').selectOption('pcs');
  await page.getByRole('radio', { name: 'Kühlschrank' }).check();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
}

test('selects several items and moves them to another storage location', async ({ page }) => {
  for (const name of ['Eier', 'Saft', 'Salami']) {
    await addToFridge(page, name);
  }
  await page.goto('/inventory?location=fridge');
  await expect(page.getByRole('link', { name: /Eier/ })).toBeVisible();

  await page.getByRole('button', { name: 'Auswählen' }).click();
  await expect(page.getByRole('button', { name: 'Fertig' })).toBeVisible();
  // Select mode: no links, so a tap cannot open the item page; no bar before something is chosen.
  await expect(page.getByRole('link', { name: /Eier/ })).toHaveCount(0);
  await expect(page.getByText('ausgewählt')).toHaveCount(0);

  await page.getByText('Eier', { exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByText('1 ausgewählt')).toBeVisible();
  await page.getByText('Saft', { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Saft' })).toBeChecked();
  await expect(page.getByText('2 ausgewählt')).toBeVisible();

  // Eggs and juice keep in a pantry (dairy would be refused, see the unsuitable_location error).
  // «Verschieben nach» offers the other three locations, not the current one.
  const bar = page.getByRole('region', { name: 'Auswahl verschieben' });
  await expect(bar.getByRole('button')).toHaveText(['Tiefkühler', 'Vorrat', 'Notvorrat']);

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);

  await bar.getByRole('button', { name: 'Vorrat', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('2 Artikel liegen jetzt im Vorrat.');
  // Back to the normal list: one item stays, no bar, no checkboxes.
  await expect(page.getByRole('button', { name: 'Auswählen' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Salami/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Eier/ })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Auswahl verschieben' })).toHaveCount(0);

  await page.getByRole('tab', { name: /Vorrat/ }).click();
  await expect(page.getByRole('link', { name: /Eier/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Saft/ })).toBeVisible();
});

test('select all, and switching the tab drops the selection', async ({ page }) => {
  for (const name of ['Eier', 'Saft']) {
    await addToFridge(page, name);
  }
  await page.goto('/inventory?location=fridge');
  await page.getByRole('button', { name: 'Auswählen' }).click();
  await page.getByRole('button', { name: 'Alle auswählen' }).click();
  await expect(page.getByText('2 ausgewählt')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keine auswählen' })).toBeVisible();

  await page.getByRole('tab', { name: /Tiefkühler/ }).click();
  await expect(page.getByText('ausgewählt')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Fertig' })).toBeVisible();
});

test('moves what fits and names what does not belong there', async ({ page }) => {
  for (const name of ['Eier', 'Vollmilch']) {
    await addToFridge(page, name);
  }
  await page.goto('/inventory?location=fridge');
  await page.getByRole('button', { name: 'Auswählen' }).click();
  await page.getByRole('button', { name: 'Alle auswählen' }).click();
  await page
    .getByRole('region', { name: 'Auswahl verschieben' })
    .getByRole('button', { name: 'Vorrat', exact: true })
    .click();
  // Milk does not keep in the pantry: the eggs move, the milk stays and is named.
  await expect(page.getByRole('status')).toHaveText(
    'Eier liegt jetzt im Vorrat. Vollmilch gehört nicht in den Vorrat, bleibt hier.',
  );
  await expect(page.getByRole('checkbox', { name: 'Vollmilch' })).toBeChecked();
  await expect(page.getByText('1 ausgewählt')).toBeVisible();
});
