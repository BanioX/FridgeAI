import type { Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

async function addToFridge(page: Page, name: string) {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill(name);
  // The place sits under «Mehr Angaben» (ADR-0026).
  if (await page.getByRole('radio', { name: 'Kühlschrank' }).isHidden()) {
    await page.getByText('Mehr Angaben').click();
  }
  await page.getByRole('radio', { name: 'Kühlschrank' }).check();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
}

/** R2-1: salad does not freeze well, so Rettich asks first; both choices work. */
test('asks before freezing salad: «Lieber nicht» keeps it, «Trotzdem einfrieren» freezes it', async ({
  page,
}) => {
  await addToFridge(page, 'Kopfsalat');
  await page.getByRole('link', { name: /Kopfsalat/ }).click();

  await page.getByRole('button', { name: 'Einfrieren', exact: true }).click();
  const hint = page.getByRole('alertdialog', { name: 'Das friert nicht gut ein' });
  await expect(hint).toContainText('Salat wird beim Auftauen matschig.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const audit = await new AxeBuilder({ page }).analyze();
  expect(audit.violations).toEqual([]);

  await hint.getByRole('button', { name: 'Lieber nicht' }).click();
  await expect(hint).toHaveCount(0);
  await expect(page.getByText(/^Eingefroren/)).toHaveCount(0);

  await page.getByRole('button', { name: 'Einfrieren', exact: true }).click();
  await page.getByRole('button', { name: 'Trotzdem einfrieren' }).click();
  await expect(page.getByText(/^Eingefroren \d+\.\d+\.$/)).toBeVisible();
});

test('the selection bar names unsuitable items and still moves the suitable ones', async ({
  page,
}) => {
  await addToFridge(page, 'Kopfsalat');
  await addToFridge(page, 'Hackfleisch');
  await page.goto('/inventory?location=fridge');

  await page.getByRole('button', { name: 'Auswählen' }).click();
  await page.getByText('Kopfsalat', { exact: true }).click();
  await page.getByText('Hackfleisch', { exact: true }).click();
  const bar = page.getByRole('group', { name: 'Verschieben nach' });
  await bar.getByRole('button', { name: 'Tiefkühler', exact: true }).click();

  const hint = page.getByRole('alertdialog');
  await expect(hint).toContainText('Salat wird beim Auftauen matschig.');
  await hint.getByRole('button', { name: 'Lieber nicht' }).click();
  await expect(page.getByRole('status')).toContainText('Hackfleisch liegt jetzt im Tiefkühler.');
  await expect(page.getByRole('status')).toContainText('Kopfsalat bleibt, wo es ist.');
});
