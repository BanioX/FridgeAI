import type { Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

async function addGlace(page: Page) {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Glace');
  if (await page.getByLabel('Menge').isHidden()) {
    await page.getByText('Mehr Angaben').click();
  }
  await page.getByLabel('Menge').fill('6');
  await page.getByLabel('Einheit').selectOption('pcs');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  // Wherever the category put it, open that tab.
  for (const name of ['Kühlschrank', 'Tiefkühler', 'Vorrat', 'Notvorrat']) {
    if ((await page.getByRole('link', { name: /Glace/ }).count()) > 0) {
      break;
    }
    await page.getByRole('tab', { name: new RegExp(name) }).click();
  }
}

async function swipeLeft(page: Page, distance: number) {
  const box = await page.getByRole('link', { name: /Glace/ }).boundingBox();
  if (box === null) {
    throw new Error('Row not found');
  }
  const y = box.y + box.height / 2;
  const startX = box.x + box.width - 30;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - distance / 2, y, { steps: 6 });
  await page.mouse.move(startX - distance, y, { steps: 6 });
  await page.mouse.up();
}

test('swipes left to eat one piece, undoes it, and a short drag changes nothing', async ({
  page,
}) => {
  await addGlace(page);
  const row = page.getByRole('link', { name: /Glace/ });
  await expect(row).toContainText('6 Stk.');
  await expect(page.getByText(/^Tipp: Wisch einen Artikel nach links/)).toBeVisible();

  // Below the threshold: the row springs back, nothing is eaten, the item page stays closed.
  await swipeLeft(page, 60);
  await expect(row).toContainText('6 Stk.');
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();

  // Past 40 % of the row.
  await swipeLeft(page, 250);
  await expect(row).toContainText('5 Stk.');
  await expect(page.getByRole('status')).toContainText('1 Glace gegessen');
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  // The tip stays for this visit, so the list does not jump under the finger.
  await expect(page.getByText(/^Tipp: Wisch einen Artikel nach links/)).toBeVisible();

  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);

  await page.getByRole('status').getByRole('button', { name: 'Rückgängig' }).click();
  await expect(row).toContainText('6 Stk.');
  await expect(page.getByRole('status')).toHaveCount(0);

  // A tap still opens the item page.
  await row.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Glace' })).toBeVisible();

  // Next visit: the tip has done its job.
  await page.goBack();
  await expect(row).toBeVisible();
  await expect(page.getByText(/^Tipp: Wisch einen Artikel nach links/)).toBeHidden();
});
