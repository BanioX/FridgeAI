import type { Locator, Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

/**
 * The pots in select mode (ADR-0055): settle the selection with a tap or a drop. Two or three
 * invented products, fridge only.
 */

async function addToFridge(page: Page, name: string, expiresOn?: string) {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill(name);
  if (expiresOn !== undefined) {
    await page.getByLabel('Haltbar bis').fill(expiresOn);
  } else {
    if (await page.getByLabel('Menge').isHidden()) {
      await page.getByText('Mehr Angaben').click();
    }
    await page.getByLabel('Menge').fill('2');
    await page.getByLabel('Einheit').selectOption('pcs');
    await page.getByRole('radio', { name: 'Kühlschrank' }).check();
  }
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
}

async function expectNoSideScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
}

test('taps «Verwertet» for two items and takes it back with «Rückgängig»', async ({ page }) => {
  for (const name of ['Eier', 'Saft']) {
    await addToFridge(page, name);
  }
  await page.goto('/inventory?location=fridge');
  await page.getByRole('button', { name: 'Auswählen' }).click();

  // Four pots under the tabs; nothing chosen yet, so none can be pressed.
  const pots = page.getByRole('region', { name: 'Auswahl abschliessen' });
  await expect(pots.getByRole('button')).toHaveText([
    'Verwertet',
    'Entsorgt',
    'Verarbeiten',
    'Nachkaufen',
  ]);
  await expect(pots.getByRole('button', { name: 'Verwertet' })).toBeDisabled();
  for (const button of await pots.getByRole('button').all()) {
    expect((await button.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  }

  await page.getByText('Eier', { exact: true }).click();
  await page.getByText('Saft', { exact: true }).click();
  await expect(page.getByText('2 ausgewählt')).toBeVisible();
  await expectNoSideScroll(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await pots.getByRole('button', { name: 'Verwertet' }).click();
  const toast = page.getByRole('status').filter({ hasText: 'verwertet' });
  await expect(toast).toContainText('2 Artikel verwertet.');
  // Select mode ended and both items left the list.
  await expect(page.getByRole('button', { name: 'Auswählen' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Eier/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Saft/ })).toHaveCount(0);

  await toast.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('link', { name: /Eier/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Saft/ })).toBeVisible();
});

test('«Verarbeiten» from select mode offers recipes for the chosen item', async ({ page }) => {
  await addToFridge(page, 'Vollmilch');
  await page.goto('/inventory?location=fridge');
  await page.getByRole('button', { name: 'Auswählen' }).click();
  await page.getByText('Vollmilch', { exact: true }).click();
  await page
    .getByRole('region', { name: 'Auswahl abschliessen' })
    .getByRole('button', { name: 'Verarbeiten' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Verarbeiten' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rezepte mit deiner Auswahl' })).toBeVisible();
  await expect(page.getByText('Mit: Vollmilch').first()).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('drags the selection onto «Entsorgt»', async ({ page }) => {
  for (const name of ['Eier', 'Saft']) {
    await addToFridge(page, name);
  }
  await page.goto('/inventory?location=fridge');
  await page.getByRole('button', { name: 'Auswählen' }).click();
  await page.getByText('Eier', { exact: true }).click();
  await page.getByText('Saft', { exact: true }).click();
  await expect(page.getByText('2 ausgewählt')).toBeVisible();

  const row = page.getByText('Eier', { exact: true });
  const pot = page.getByRole('button', { name: 'Entsorgt' });
  // L-24: wait until the rows stand still before the gesture.
  await expect
    .poll(async () => {
      const first = await row.boundingBox();
      await page.waitForTimeout(100);
      return JSON.stringify(first) === JSON.stringify(await row.boundingBox());
    })
    .toBe(true);

  const box = async (target: Locator) => {
    const found = await target.boundingBox();
    expect(found).not.toBeNull();
    return found ?? { x: 0, y: 0, width: 0, height: 0 };
  };
  const from = await box(row);
  const to = await box(pot);
  await page.mouse.move(from.x + 10, from.y + 5);
  await page.mouse.down();
  await page.waitForTimeout(400);
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });

  // During the drag every pot shows the dashed «drop here» look, the one under the finger lifts.
  await expect(page.getByRole('button', { name: 'Verwertet' })).toHaveClass(/outline-dashed/);
  await expect(pot).toHaveClass(/scale-105/);
  await page.mouse.up();

  await expect(page.getByRole('status').filter({ hasText: 'entsorgt' })).toContainText(
    '2 Artikel entsorgt.',
  );
  await expect(page.getByRole('link', { name: /Eier/ })).toHaveCount(0);
  await expectNoSideScroll(page);
});

test('asks «Ohne Rettich im Abfall gelandet?» for food due today, and «Ja, gerettet» records it', async ({
  page,
}) => {
  const today = new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
  await addToFridge(page, 'Quark', today);
  await addToFridge(page, 'Saft');
  await page.goto('/inventory?location=fridge');
  await page.getByRole('button', { name: 'Auswählen' }).click();
  await page.getByText('Quark', { exact: true }).click();
  await page.getByText('Saft', { exact: true }).click();
  await page
    .getByRole('region', { name: 'Auswahl abschliessen' })
    .getByRole('button', { name: 'Verwertet' })
    .click();

  // Asked once, and only for the food that was about to go off.
  const sheet = page.getByRole('alertdialog');
  await expect(
    sheet.getByRole('heading', { name: 'Ohne Rettich im Abfall gelandet?' }),
  ).toBeVisible();
  await expect(sheet.getByText('Quark', { exact: true })).toBeVisible();
  await expect(sheet.getByText('Saft', { exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('radio', { name: 'Nein' })).toBeChecked();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await sheet.locator('label').filter({ hasText: 'Ja, gerettet' }).click();
  await sheet.getByRole('button', { name: 'Als verwertet speichern' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'verwertet' })).toContainText(
    '2 Artikel verwertet.',
  );

  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  await expect(page.getByText(/1 Rettung diesen Monat/)).toBeVisible();
});
