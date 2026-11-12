import type { Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

/** Tap a chip the way people do: on its label (the radio itself is visually hidden). */
async function choose(page: Page, name: string) {
  await page.locator('label').filter({ hasText: name }).click();
  await expect(page.getByRole('radio', { name })).toBeChecked();
}

async function expectNoOverflow(page: Page) {
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
}

test("marks a dessert as Mia's, shows it calmly and takes the mark away again", async ({
  page,
}) => {
  // 1. Add Mia on «Personen».
  await page.goto('/more/people');
  await expect(page.getByRole('heading', { level: 1, name: 'Personen' })).toBeVisible();
  await page.getByLabel('Name', { exact: true }).fill('Mia');
  await page.getByRole('button', { name: 'Person hinzufügen' }).click();
  await expect(page.getByRole('status')).toContainText('Mia ist dabei.');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expectNoOverflow(page);

  // 2. «Schokoladenmousse», Gehört: Mia, under «Mehr Angaben».
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Schokoladenmousse');
  await page.getByText(/^Mehr Angaben/).click();
  await choose(page, 'Mia');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  // 3. The row in the Vorrat carries the badge «Gehört Mia».
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  const row = page.getByRole('link', { name: /Schokoladenmousse/ });
  await expect(row.getByRole('img', { name: 'Gehört Mia' })).toBeVisible();
  await expectNoOverflow(page);

  // 4. The item page shows the calm line.
  await row.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Schokoladenmousse' })).toBeVisible();
  await expect(page.getByText('Gehört Mia. Frag lieber, bevor du es verwertest.')).toBeVisible();

  // 6. Axe and no horizontal scroll (checked here, with the «Gehört» card on screen).
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expectNoOverflow(page);

  // 5. Back to «Allen»: the line and the badge are gone.
  await choose(page, 'Allen');
  await expect(page.getByText(/Frag lieber, bevor du es verwertest/)).toHaveCount(0);
  await page.getByRole('link', { name: 'Zurück zum Vorrat' }).click();
  await expect(page.getByRole('link', { name: /Schokoladenmousse/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /^Gehört/ })).toHaveCount(0);
});
