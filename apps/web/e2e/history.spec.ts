import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';

test('deletes a wrong «Weggeworfen» from the history, the food comes back', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Joghurt');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Joghurt/ }).click();
  await page.locator('label').filter({ hasText: 'Weggeworfen' }).click();
  await page.locator('label').filter({ hasText: 'vergessen' }).click();
  await page.getByRole('button', { name: 'Als weggeworfen speichern' }).click();
  // Wait until it is saved: the Vorrat page confirms it (a reload too early would lose it).
  await expect(page.getByRole('status')).toHaveText('Joghurt: als weggeworfen gespeichert.');

  // From «Deine Wirkung» on Start to the history.
  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  await page.getByRole('link', { name: 'Verlauf ansehen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Verlauf' })).toBeVisible();
  const entry = page.getByRole('listitem').filter({ hasText: 'Joghurt' });
  await expect(entry).toContainText('Weggeworfen');
  await expect(entry).toContainText('vergessen');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole('button', { name: 'Eintrag Joghurt löschen' }).click();
  await page.getByRole('button', { name: 'Abbrechen' }).click();
  await page.getByRole('button', { name: 'Eintrag Joghurt löschen' }).click();
  await page.getByRole('button', { name: 'Eintrag löschen', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Eintrag gelöscht. Joghurt ist wieder im Vorrat.',
  );
  await expect(page.getByText('In diesem Zeitraum hast du nichts abgeschlossen.')).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: 'Vorrat' }).click();
  await expect(page.getByRole('link', { name: /Joghurt/ })).toBeVisible();
});

test('corrects a wrong «Weggeworfen» to «Gegessen», the impact follows', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Rahm');
  // Expires tomorrow: eating it counts as a rescue (ADR-0033).
  await page.getByRole('button', { name: 'morgen', exact: true }).click();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Rahm/ }).click();
  await page.locator('label').filter({ hasText: 'Weggeworfen' }).click();
  await page.locator('label').filter({ hasText: 'verdorben' }).click();
  await page.getByRole('button', { name: 'Als weggeworfen speichern' }).click();
  // Wait until it is saved: the Vorrat page confirms it (a reload too early would lose it).
  await expect(page.getByRole('status')).toHaveText('Rahm: als weggeworfen gespeichert.');

  await page.goto('/more/history');
  await page.getByRole('button', { name: 'Eintrag Rahm ändern' }).click();
  await page
    .locator('label')
    .filter({ hasText: /^Gegessen$/ })
    .click();
  await expect(page.getByRole('group', { name: 'Warum?' })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('status')).toHaveText('Gespeichert: Rahm ist jetzt «Gegessen».');
  const entry = page.getByRole('listitem').filter({ hasText: 'Rahm' });
  await expect(entry).toContainText('Gegessen');
  await expect(entry).not.toContainText('verdorben');

  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  await expect(page.getByRole('img', { name: '100 % gerettet' })).toBeVisible();
});
