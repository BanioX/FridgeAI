import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './test';

/** Tap a chip the way people do: on its label (the radio itself is visually hidden). */
async function choose(page: Page, name: string) {
  await page.locator('label').filter({ hasText: name }).click();
  await expect(page.getByRole('radio', { name })).toBeChecked();
}

test('eats part of a cheese, opens it and throws the rest away with a reason', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Grana Padano');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await page.getByRole('link', { name: /Grana Padano/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Grana Padano' })).toBeVisible();
  // Hard cheese splits in thirds and quarters; «alles» is preselected.
  await expect(page.getByRole('radio', { name: 'alles' })).toBeChecked();
  await expect(page.getByRole('radio', { name: '⅓ · 100 g' })).toBeVisible();

  const detail = await new AxeBuilder({ page }).analyze();
  expect(detail.violations).toEqual([]);

  await page.getByRole('button', { name: 'Als geöffnet markieren' }).click();
  await expect(page.getByRole('status')).toContainText(/Geöffnet/);
  await expect(page.getByText(/^Geöffnet am/)).toBeVisible();

  await choose(page, '⅓ · 100 g');
  await page.getByRole('button', { name: 'Als gegessen speichern' }).click();
  await expect(page.getByRole('status')).toHaveText('Gespeichert. Noch 200 g übrig.');

  await choose(page, 'Weggeworfen');
  await choose(page, 'vergessen');
  await page.getByRole('button', { name: 'Als weggeworfen speichern' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Grana Padano/ })).toHaveCount(0);

  // The start page now shows the month's impact: only what was thrown away.
  const cspErrors: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) {
      cspErrors.push(message.text());
    }
  });
  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { name: 'Deine Wirkung diesen Monat' })).toBeVisible();
  // The cheese was still fresh: eating a third is no rescue (ADR-0033), throwing the rest away
  // is waste, so nothing of what was at risk was rescued.
  await expect(page.getByRole('img', { name: '0 % gerettet' })).toBeVisible();
  await expect(page.getByText('1 Artikel', { exact: true })).toBeVisible();
  const today = await new AxeBuilder({ page }).analyze();
  expect(today.violations).toEqual([]);
  expect(cspErrors).toEqual([]);
});

test('a wrong tap can be undone, in part and in full', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Grana Padano');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Grana Padano/ }).click();

  await choose(page, '⅓ · 100 g');
  await page.getByRole('button', { name: 'Als gegessen speichern' }).click();
  await expect(page.getByRole('status')).toHaveText('Gespeichert. Noch 200 g übrig.');
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('status')).toHaveText('Rückgängig gemacht. Wieder 300 g da.');
  await expect(page.getByRole('button', { name: 'Rückgängig' })).toHaveCount(0);
  await expect(page.getByText('300 g · Kühlschrank')).toBeVisible();

  await choose(page, 'Weggeworfen');
  await page.getByRole('button', { name: 'Als weggeworfen speichern' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Grana Padano: als weggeworfen gespeichert.');
  await expect(page.getByRole('link', { name: /Grana Padano/ })).toHaveCount(0);
  const notice = await new AxeBuilder({ page }).analyze();
  expect(notice.violations).toEqual([]);

  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('status')).toHaveText('Grana Padano ist wieder im Vorrat.');
  await expect(page.getByRole('link', { name: /Grana Padano/ })).toBeVisible();
  await expect(page.getByText('300 g · Kühlschrank')).toBeVisible();
});

test('a free amount larger than what is left is refused', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Basmatireis');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Basmatireis/ }).click();

  await page.getByLabel(/Andere Menge/).fill('5000');
  await expect(page.getByText('Bitte eine Menge zwischen 0 und dem Rest angeben.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Als gegessen speichern' })).toBeDisabled();
});

test('corrects date, date kind, quantity and value of an item', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Freilandeier');
  await page.getByRole('button', { name: '10er' }).click();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Freilandeier/ }).click();

  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Freilandeier bearbeiten' }),
  ).toBeVisible();
  await expect(page.getByLabel(/Was noch da ist/)).toHaveValue('10');
  const form = await new AxeBuilder({ page }).analyze();
  expect(form.violations).toEqual([]);

  await page.getByRole('button', { name: 'Änderungen speichern' }).click();
  await expect(page.getByRole('status')).toHaveText('Nichts geändert.');

  await page.getByLabel('Haltbar bis').fill('24.12.2027');
  await choose(page, 'Zu verbrauchen');
  await page.getByLabel(/Was noch da ist/).fill('6');
  await page.getByLabel(/Wert in CHF/).fill('4.20');
  await page.getByRole('button', { name: 'Änderungen speichern' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Freilandeier' })).toBeVisible();
  await expect(page.getByText('6 Stk. · Kühlschrank')).toBeVisible();
  await expect(page.getByText('Zu verbrauchen bis')).toBeVisible();
  await expect(page.getByText(/24\. Dez\. 2027/)).toBeVisible();
  await expect(page.getByText('(geschätzt)')).toHaveCount(0);

  // «Back» goes to the list, not into the form again.
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
});

test('fixes a typo, the category and the place of an item', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Apfle');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Apfle/ }).click();
  await page.getByRole('link', { name: 'Bearbeiten' }).click();

  await page.getByLabel('Was ist es?').fill('Apfel');
  await page.getByLabel('Kategorie').selectOption({ label: 'Äpfel & Birnen' });
  // Exact, so «Notvorrat» does not match too.
  await page
    .locator('label')
    .filter({ hasText: /^Vorrat$/ })
    .click();
  await expect(page.getByRole('radio', { name: 'Vorrat', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Änderungen speichern' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Apfel' })).toBeVisible();
  await expect(page.getByText('1 Stk. · Vorrat')).toBeVisible();
});

test('deletes an item entered by mistake, with undo, without counting it as wasted', async ({
  page,
}) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Testjoghurt');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Testjoghurt/ }).click();

  await page.getByRole('button', { name: 'Artikel löschen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Testjoghurt gelöscht.');
  await expect(page.getByRole('link', { name: /Testjoghurt/ })).toHaveCount(0);

  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('status')).toHaveText('Testjoghurt ist wieder im Vorrat.');
  await expect(page.getByRole('link', { name: /Testjoghurt/ })).toBeVisible();

  // Deleted for good this time: nothing shows up as wasted on the start page.
  await page.getByRole('link', { name: /Testjoghurt/ }).click();
  await page.getByRole('button', { name: 'Artikel löschen' }).click();
  await expect(page.getByRole('status')).toHaveText('Testjoghurt gelöscht.');
  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Start' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Deine Wirkung diesen Monat' })).toHaveCount(0);
});

test('offers «Nachkaufen» after an item is used up', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Mozzarella');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Mozzarella/ }).click();
  await page.getByRole('button', { name: 'Als gegessen speichern' }).click();

  await expect(page.getByRole('status')).toHaveText('Mozzarella: als gegessen gespeichert.');
  await page.getByRole('button', { name: 'Nachkaufen' }).click();
  await expect(page.getByRole('status')).toHaveText('Mozzarella steht bei «Nachkaufen».');
  await expect(page.getByRole('button', { name: 'Nachkaufen' })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole('navigation').getByRole('link', { name: 'Mehr' }).click();
  await page.getByRole('link', { name: /^Nachkaufen/ }).click();
  await expect(page.getByRole('checkbox', { name: 'Mozzarella' })).toBeVisible();
});
