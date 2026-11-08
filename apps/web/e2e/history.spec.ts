import { AxeBuilder, expect, test } from './test';

test('deletes a wrong «Entsorgt» from the history, the food comes back', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Joghurt');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Joghurt/ }).click();
  await page.locator('label').filter({ hasText: 'Entsorgt' }).click();
  await page.locator('label').filter({ hasText: 'vergessen' }).click();
  await page.getByRole('button', { name: 'Als entsorgt speichern' }).click();
  // Wait until it is saved: the Vorrat page confirms it (a reload too early would lose it).
  await expect(page.getByRole('status')).toHaveText('Joghurt: als entsorgt gespeichert.');

  // A tap on the «Entsorgt» ring of the «Bilanz» opens the journal with what was thrown away.
  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  await page.getByRole('link', { name: /^Entsorgt: 100 %/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Journal' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Entsorgt' })).toBeChecked();
  await expect(page.getByText(/^Total CHF \d+\.\d{2} · 1 Eintrag$/)).toBeVisible();
  const entry = page.getByRole('listitem').filter({ hasText: 'Joghurt' });
  await expect(entry).toContainText('Entsorgt');
  await expect(entry).toContainText('vergessen');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  // «Verwertet» shows nothing here, «Alle» shows it again.
  await page.locator('label').filter({ hasText: 'Verwertet' }).click();
  await expect(page.getByText('In diesem Zeitraum hast du nichts abgeschlossen.')).toBeVisible();
  await page.locator('label').filter({ hasText: 'Alle' }).click();
  await expect(entry).toBeVisible();

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

test('corrects a wrong «Entsorgt» to «Verwertet», the impact follows', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Rahm');
  await page.getByRole('button', { name: 'morgen', exact: true }).click();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Rahm/ }).click();
  await page.locator('label').filter({ hasText: 'Entsorgt' }).click();
  await page.locator('label').filter({ hasText: 'verdorben' }).click();
  await page.getByRole('button', { name: 'Als entsorgt speichern' }).click();
  // Wait until it is saved: the Vorrat page confirms it (a reload too early would lose it).
  await expect(page.getByRole('status')).toHaveText('Rahm: als entsorgt gespeichert.');

  await page.goto('/more/history');
  await page.getByRole('button', { name: 'Eintrag Rahm ändern' }).click();
  await page
    .getByRole('group', { name: 'Was ist damit passiert?' })
    .locator('label')
    .filter({ hasText: /^Verwertet$/ })
    .click();
  await expect(page.getByRole('group', { name: 'Warum?' })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('status')).toHaveText('Gespeichert: Rahm ist jetzt «Verwertet».');
  const entry = page.getByRole('listitem').filter({ hasText: 'Rahm' });
  await expect(entry).toContainText('Verwertet');
  await expect(entry).not.toContainText('verdorben');

  // Nothing thrown away any more; a corrected entry is eaten, not «gerettet» (ADR-0039).
  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('img', { name: /% gerettet$/ })).toHaveCount(0);
});
