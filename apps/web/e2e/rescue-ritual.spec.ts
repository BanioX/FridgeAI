import { AxeBuilder, expect, test } from './test';

/** Today as TT.MM.JJJJ, the way the date field takes it. */
function todayText(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${String(now.getFullYear())}`;
}

test('on Start, hold a row of «Heute retten» and drag it into the basket: rescued, with its moment', async ({
  page,
}) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Joghurt');
  await page.getByLabel('Haltbar bis').fill(todayText());
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();

  await page.goto('/');
  const row = page
    .getByRole('region', { name: 'Heute retten' })
    .getByRole('link', { name: /Joghurt/ });
  const box = await row.boundingBox();
  if (box === null) {
    throw new Error('No row');
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(650);
  const basket = page.locator('[data-drop-target="action:eaten"]');
  await expect(basket).toBeVisible();
  const target = await basket.boundingBox();
  if (target === null) {
    throw new Error('No basket');
  }
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
  await page.mouse.up();

  const moment = page.getByRole('status').filter({ hasText: 'Deine erste Rettung diesen Monat' });
  await expect(moment).toBeVisible();
  await expect(moment).toContainText('Gerettet');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
