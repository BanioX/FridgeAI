import { AxeBuilder, expect, test } from './test';

/**
 * «Gerettet» only when confirmed (ADR-0039): bread eaten before its date is just eaten; yoghurt on
 * its last day asks «Ohne Rettich im Abfall gelandet?», and only «Ja, gerettet» counts. The
 * rescue is then shown as what it was worth (ADR-0042).
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
  await page.getByRole('button', { name: 'Als verwertet speichern' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();

  // The reward (ADR-0042): what it was worth, the month so far and a food fact, no «Danke».
  await expect(page.getByRole('status')).toHaveText(
    // No price from a receipt: the value is an estimate and says so.
    /^Gerettet: Joghurt, etwa CHF \d+\.\d{2}\.$/,
  );
  await expect(page.getByText(/^Diesen Monat gerettet: CHF \d+\.\d{2}$/)).toBeVisible();
  await expect(page.getByText('Wusstest du?')).toBeVisible();
  await expect(page.getByText(/Danke/)).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  // Rescued and used up: all of it «Verwertet» in the rings (ADR-0046), and 100 % of what was
  // at risk was rescued.
  await expect(page.getByRole('img', { name: /^Verwertet: 100 %/ })).toBeVisible();
  await expect(page.getByText(/100 % gerettet von allem, was knapp wurde/)).toBeVisible();
  // The Rettich grew its first leaf (ADR-0043).
  await expect(page.getByRole('img', { name: 'Dein Rettich: Keimling, 1 Blatt' })).toBeVisible();
  await expect(page.getByText('1 Rettung diesen Monat · noch 2 bis Jungpflanze')).toBeVisible();
});
