import type { Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

/** Where the main navigation sits: the tab bar at the bottom or the sidebar on the left (ADR-0092). */
async function navBox(page: Page) {
  const box = await page.getByRole('navigation', { name: 'Hauptnavigation' }).boundingBox();
  if (box === null) {
    throw new Error('navigation is not visible');
  }
  return box;
}

for (const { name, width, height, sidebar } of [
  { name: 'iPhone', width: 390, height: 844, sidebar: false },
  { name: 'iPad hochkant', width: 820, height: 1180, sidebar: false },
  { name: 'iPad quer', width: 1180, height: 820, sidebar: true },
  { name: 'Computer', width: 1440, height: 900, sidebar: true },
]) {
  test(`${name}: ${sidebar ? 'sidebar on the left' : 'tab bar at the bottom'}, nothing scrolls sideways`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/inventory');
    await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
    const nav = await navBox(page);
    const main = await page.getByRole('main').boundingBox();
    if (sidebar) {
      expect(nav.x).toBe(0);
      expect(nav.height).toBeGreaterThanOrEqual(height - 1);
      // The page starts right of the sidebar, never under it.
      expect(main?.x ?? 0).toBeGreaterThanOrEqual(nav.width);
    } else {
      expect(nav.width).toBe(width);
      expect(nav.y + nav.height).toBeGreaterThanOrEqual(height - 1);
    }
    // The tab order stays Start, Vorrat, Erfassen, Wissen, Mehr in both forms.
    await expect(
      page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link'),
    ).toHaveText(['Start', 'Vorrat', 'Erfassen', 'Wissen', 'Mehr']);
    await page.getByRole('navigation').getByRole('link', { name: 'Wissen' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Wissen' })).toBeVisible();
    for (const route of ['/', '/inventory', '/add', '/knowledge', '/more']) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scroll, `${route} at ${String(width)} px`).toBeLessThanOrEqual(width);
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('the width is used: lists side by side under «Wissen», calm tiles, chips wrap', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/knowledge');
  const explain = await page.getByRole('heading', { level: 2, name: 'Kurz erklärt' }).boundingBox();
  const everyday = await page
    .getByRole('heading', { level: 2, name: 'Rettich im Alltag' })
    .boundingBox();
  expect(everyday?.y).toBe(explain?.y);
  expect(everyday?.x ?? 0).toBeGreaterThan(explain?.x ?? 0);

  // A location tile keeps a calm height instead of growing square with the column.
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Joghurt');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await page.goto('/');
  const tile = await page
    .getByRole('region', { name: 'Lagerorte' })
    .getByRole('link')
    .first()
    .boundingBox();
  expect(tile?.height ?? 0).toBeLessThanOrEqual(120);

  // On a phone the lists stay one below the other.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/knowledge');
  const explainPhone = await page
    .getByRole('heading', { level: 2, name: 'Kurz erklärt' })
    .boundingBox();
  const everydayPhone = await page
    .getByRole('heading', { level: 2, name: 'Rettich im Alltag' })
    .boundingBox();
  expect(everydayPhone?.y ?? 0).toBeGreaterThan(explainPhone?.y ?? 0);
});

test.describe('on a touch screen', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('the tip says swipe, not drag', async ({ page }) => {
    await page.goto('/inventory/new');
    await page.getByLabel('Was ist es?').fill('Joghurt');
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(page.getByText(/^Tipp: Wisch nach links/)).toBeVisible();
    await expect(page.getByText(/^Tipp: Zieh einen Artikel/)).toBeHidden();
  });
});
