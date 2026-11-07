import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';

test('adds an item: the name suggests category, amount and unit', async ({ page }) => {
  await page.goto('/inventory');
  await page.getByRole('link', { name: 'Hinzufügen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Artikel erfassen' })).toBeVisible();

  // Saving without a name explains what is missing.
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByText('Bitte gib an, was es ist.')).toBeVisible();

  await page.getByLabel('Was ist es?').fill('Grana Padano');
  // The category works in the background; it shows only under «Mehr Angaben» (ADR-0026).
  await expect(page.getByLabel('Kategorie')).toBeHidden();
  await page.getByText('Mehr Angaben').click();
  await expect(page.getByLabel('Kategorie')).toHaveValue('dairy-cheese-hard');
  await expect(page.getByLabel('Menge')).toHaveValue('300');
  await expect(page.getByLabel('Einheit')).toHaveValue('g');
  await expect(page.getByRole('radio', { name: 'Kühlschrank' })).toBeChecked();

  const form = await new AxeBuilder({ page }).analyze();
  expect(form.violations).toEqual([]);

  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByText('Grana Padano')).toBeVisible();
  await expect(page.getByText('300 g · Kühlschrank')).toBeVisible();
});

test('adds eggs by pack size; the pack type sits under «Mehr Angaben»', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Freilandeier');
  await page.getByRole('button', { name: '10er' }).click();
  await expect(page.getByLabel('Menge')).toHaveValue('10');
  await expect(page.getByLabel('Verpackung')).toBeHidden();
  await page.getByText('Mehr Angaben').click();
  await expect(page.getByLabel('Verpackung')).toHaveValue('box');

  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByText('10 Stk. · Kühlschrank')).toBeVisible();
});

test('the form is lean: no barcode button, no quick add, one save button', async ({ page }) => {
  await page.goto('/inventory/new');
  await expect(page.getByRole('button', { name: 'Barcode scannen' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Schnell erfassen' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /nächsten erfassen/ })).toHaveCount(0);
  // Location and price are folded away, but the disclosure says what is set.
  await expect(page.getByRole('radio', { name: 'Tiefkühler' })).toBeHidden();
  // «Kühlschrank zuerst»: without a known category the food goes to the fridge.
  await expect(page.getByText('Mehr Angaben · Kühlschrank')).toBeVisible();
  await page.getByText('Mehr Angaben').click();
  await page.getByText('Tiefkühler', { exact: true }).click();
  await page.getByLabel('Preis in CHF (freiwillig)').fill('3.95');
  await expect(page.getByText('Mehr Angaben · Tiefkühler, CHF 3.95')).toBeVisible();
});

test('a tap on the calendar symbol lands on the real date field (iPhone opens its wheel)', async ({
  page,
}) => {
  await page.goto('/inventory/new');
  const calendar = page.getByLabel('Kalender öffnen');
  // In the middle of the screen, like a person sees it, not under the tab bar.
  await calendar.evaluate((element) => {
    element.scrollIntoView({ block: 'center' });
  });
  const box = await calendar.boundingBox();
  expect(box).not.toBeNull();
  const { x, y, width, height } = box ?? { x: 0, y: 0, width: 0, height: 0 };
  // Whatever lies under the middle of the symbol receives the tap: it must be the date field.
  const hit = await page.evaluate(
    ([px, py]) => {
      const element = document.elementFromPoint(px ?? 0, py ?? 0);
      return element instanceof HTMLInputElement ? element.type : element?.tagName;
    },
    [x + width / 2, y + height / 2],
  );
  expect(hit).toBe('date');
  await calendar.fill('2026-12-24');
  await expect(page.getByLabel('Haltbar bis')).toHaveValue('24.12.2026');
});
