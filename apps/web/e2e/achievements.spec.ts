import { AxeBuilder, expect, test } from './test';

/**
 * «Abzeichen» (docs/abzeichen.md, ADR-0054): one confirmed rescue unlocks «Erste Rettung». It
 * shows on Start and on the page under «Mehr», each medal reads as one sentence, and a calm note
 * says so, without confetti.
 */
test('one rescue unlocks «Erste Rettung» on Start and under Mehr', async ({ page }) => {
  const today = new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  // Nothing unlocked yet: no section on Start.
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2, name: 'Abzeichen' })).toHaveCount(0);

  // Yoghurt on its last day, confirmed as a rescue.
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Joghurt');
  await page.getByLabel('Haltbar bis').fill(today);
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('link', { name: /Joghurt/ }).click();
  await page.locator('label').filter({ hasText: 'Ja, gerettet' }).click();
  await page.getByRole('button', { name: 'Als verwertet speichern' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(
    page.getByRole('status').filter({ hasText: 'Neues Abzeichen: Erste Rettung.' }),
  ).toBeVisible();

  // Start: the newest ones under the Bilanz.
  await page.getByRole('navigation').getByRole('link', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Abzeichen' })).toBeVisible();
  await expect(
    page.getByRole('img', { name: new RegExp(`^Erste Rettung, freigeschaltet am ${today}`) }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // Mehr: all of them, by family, the open ones with what is missing.
  await page.getByRole('navigation').getByRole('link', { name: 'Mehr' }).click();
  await page.getByRole('link', { name: /^Abzeichen/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Abzeichen' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mehr', exact: true }).first()).toBeVisible();
  for (const family of ['Retten', 'Bilanz', 'Kochen und Verarbeiten', 'Vorrat']) {
    await expect(page.getByRole('heading', { level: 2, name: family })).toBeVisible();
  }
  await expect(
    page.getByRole('img', { name: new RegExp(`^Erste Rettung, freigeschaltet am ${today}`) }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Rettungsdienst, noch offen: noch 9 Rettungen' }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
