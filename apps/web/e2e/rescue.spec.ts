import { AxeBuilder, expect, test } from './test';

/**
 * «Gerettet» only when confirmed (ADR-0039): bread eaten before its date is just eaten; yoghurt on
 * its last day asks «Ohne Rettich im Abfall gelandet?», and only «Ja, gerettet» counts.
 */
test('counts a rescue only when the person confirms it on the brink', async ({ page }) => {
  const today = new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  // Bread for tomorrow: no question, eating is eating.
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Ruchbrot');
  await page.getByRole('button', { name: 'morgen', exact: true }).click();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Ruchbrot/ }).click();
  await expect(page.getByRole('group', { name: 'Ohne Rettich im Abfall gelandet?' })).toHaveCount(
    0,
  );

  // Yoghurt on its last day: the question comes, «Nein» is preselected.
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Joghurt');
  await page.getByLabel('Haltbar bis').fill(today);
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Joghurt/ }).click();
  const question = page.getByRole('group', { name: 'Ohne Rettich im Abfall gelandet?' });
  await expect(question).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Nein' })).toBeChecked();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.locator('label').filter({ hasText: 'Ja, gerettet' }).click();
  await page.getByRole('button', { name: 'Als gegessen speichern' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  await expect(page.getByRole('img', { name: '100 % gerettet' })).toBeVisible();
});
