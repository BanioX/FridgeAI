import type { Locator, Page } from '@playwright/test';
import { AxeBuilder, expect, test } from './test';

test.use({ viewport: { width: 390, height: 844 } });

async function addToFridge(page: Page, name: string) {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill(name);
  if (await page.getByLabel('Menge').isHidden()) {
    await page.getByText('Mehr Angaben').click();
  }
  await page.getByLabel('Menge').fill('2');
  await page.getByLabel('Einheit').selectOption('pcs');
  await page.getByRole('radio', { name: 'Kühlschrank' }).check();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
}

test('selects several items and moves them to another storage location', async ({ page }) => {
  for (const name of ['Eier', 'Saft', 'Salami']) {
    await addToFridge(page, name);
  }
  await page.goto('/inventory?location=fridge');
  await expect(page.getByRole('link', { name: /Eier/ })).toBeVisible();

  await page.getByRole('button', { name: 'Auswählen' }).click();
  await expect(page.getByRole('button', { name: 'Fertig' })).toBeVisible();
  // Select mode: no links, so a tap cannot open the item page; no bar before something is chosen.
  await expect(page.getByRole('link', { name: /Eier/ })).toHaveCount(0);
  await expect(page.getByText('ausgewählt')).toHaveCount(0);

  await page.getByText('Eier', { exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible();
  await expect(page.getByText('1 ausgewählt')).toBeVisible();
  await page.getByText('Saft', { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Saft' })).toBeChecked();
  await expect(page.getByText('2 ausgewählt')).toBeVisible();

  // Eggs and juice keep in a pantry (dairy would be refused, see the unsuitable_location error).
  // While something is chosen, the tabs turn into «Verschieben nach» in the same place: the current
  // location says «hier», the other three are targets (one place for tap and drop).
  const bar = page.getByRole('group', { name: 'Verschieben nach' });
  await expect(bar.getByRole('button')).toHaveText([
    /Kühlschrank.*hier/,
    'Tiefkühler',
    'Vorrat',
    'Notvorrat',
  ]);
  await expect(bar.getByRole('button', { name: /Kühlschrank/ })).toBeDisabled();
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ändern' })).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);

  await bar.getByRole('button', { name: 'Vorrat', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('2 Artikel liegen jetzt im Vorrat.');
  // Back to the normal list: one item stays, no bar, no checkboxes.
  await expect(page.getByRole('button', { name: 'Auswählen' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Salami/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Eier/ })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Verschieben nach' })).toHaveCount(0);

  await page.getByRole('tab', { name: /Vorrat/ }).click();
  await expect(page.getByRole('link', { name: /Eier/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Saft/ })).toBeVisible();
});

test('select all and none; with nothing chosen, the tabs switch again', async ({ page }) => {
  for (const name of ['Eier', 'Saft']) {
    await addToFridge(page, name);
  }
  await page.goto('/inventory?location=fridge');
  await page.getByRole('button', { name: 'Auswählen' }).click();
  await page.getByRole('button', { name: 'Alle auswählen' }).click();
  await expect(page.getByText('2 ausgewählt')).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(0);
  await page.getByRole('button', { name: 'Keine auswählen' }).click();
  await expect(page.getByText('ausgewählt')).toHaveCount(0);

  await page.getByRole('tab', { name: /Tiefkühler/ }).click();
  await expect(page.getByRole('tab', { name: /Tiefkühler/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Fertig' })).toBeVisible();
});

test('moves what fits and names what does not belong there', async ({ page }) => {
  for (const name of ['Eier', 'Vollmilch']) {
    await addToFridge(page, name);
  }
  await page.goto('/inventory?location=fridge');
  await page.getByRole('button', { name: 'Auswählen' }).click();
  await page.getByRole('button', { name: 'Alle auswählen' }).click();
  await page
    .getByRole('group', { name: 'Verschieben nach' })
    .getByRole('button', { name: 'Vorrat', exact: true })
    .click();
  // Milk does not keep in the pantry: the eggs move, the milk stays and is named.
  await expect(page.getByRole('status')).toHaveText(
    'Eier liegt jetzt im Vorrat. Vollmilch gehört nicht in den Vorrat, bleibt hier.',
  );
  await expect(page.getByRole('checkbox', { name: 'Vollmilch' })).toBeChecked();
  await expect(page.getByText('1 ausgewählt')).toBeVisible();
});

test('drags the selected items onto a storage-location tab', async ({ page }) => {
  for (const name of ['Eier', 'Saft']) {
    await addToFridge(page, name);
  }
  await page.goto('/inventory?location=fridge');
  await page.getByRole('button', { name: 'Auswählen' }).click();
  await page.getByText('Eier', { exact: true }).click();
  await page.getByText('Saft', { exact: true }).click();
  await expect(page.getByText('2 ausgewählt')).toBeVisible();

  const row = page.getByText('Eier', { exact: true });
  const vorrat = page
    .getByRole('group', { name: 'Verschieben nach' })
    .getByRole('button', { name: 'Vorrat', exact: true });
  // L-24: wait until the rows stand still before the gesture.
  await expect
    .poll(async () => {
      const first = await row.boundingBox();
      await page.waitForTimeout(100);
      return JSON.stringify(first) === JSON.stringify(await row.boundingBox());
    })
    .toBe(true);

  const box = async (target: Locator) => {
    const found = await target.boundingBox();
    expect(found).not.toBeNull();
    return found ?? { x: 0, y: 0, width: 0, height: 0 };
  };
  const from = await box(row);
  const to = await box(vorrat);
  const drag = async (endX: number, endY: number) => {
    await page.mouse.move(from.x + 10, from.y + 5);
    await page.mouse.down();
    await page.waitForTimeout(400);
    await page.mouse.move(endX, endY, { steps: 12 });
  };

  // Released outside the targets: nothing changes, and the long press did not toggle the rows.
  await drag(200, 700);
  await expect(page.getByText('2 Artikel', { exact: true })).toBeVisible();
  await page.mouse.up();
  await expect(page.getByText('2 Artikel', { exact: true })).toHaveCount(0);
  await expect(page.getByText('2 ausgewählt')).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: 'Eier' })).toBeChecked();

  // Released on «Vorrat»: both items move.
  await drag(to.x + to.width / 2, to.y + to.height / 2);
  await expect(page.getByText('2 Artikel', { exact: true })).toBeVisible();
  await page.mouse.up();
  await expect(page.getByRole('status')).toHaveText('2 Artikel liegen jetzt im Vorrat.');
  // The move ends select mode: the tabs are back.
  await page.getByRole('tab', { name: /Vorrat/ }).click();
  await expect(page.getByRole('link', { name: /Eier/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Saft/ })).toBeVisible();
});

test('a long press in the normal list starts select mode and the drag', async ({ page }) => {
  for (const name of ['Eier', 'Saft']) {
    await addToFridge(page, name);
  }
  await page.goto('/inventory?location=fridge');
  const row = page.getByRole('link', { name: /Eier/ });
  await expect(row).toBeVisible();
  await expect
    .poll(async () => {
      const first = await row.boundingBox();
      await page.waitForTimeout(100);
      return JSON.stringify(first) === JSON.stringify(await row.boundingBox());
    })
    .toBe(true);
  const from = await row.boundingBox();
  expect(from).not.toBeNull();
  const x = (from?.x ?? 0) + 120;
  const y = (from?.y ?? 0) + (from?.height ?? 0) / 2;

  // Long press without moving: select mode with the row chosen, the item page stays closed.
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.up();
  await expect(page.getByText('1 ausgewählt')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Eier' })).toBeChecked();
  await expect(page).toHaveURL(/\/inventory\?location=fridge/);

  // Leave select mode, then hold and drag from the normal list onto «Vorrat».
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('link', { name: /Eier/ })).toBeVisible();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(600);
  // The hold started select mode: the tabs turned into «Verschieben nach» in the same place.
  const target = await page
    .getByRole('group', { name: 'Verschieben nach' })
    .getByRole('button', { name: 'Vorrat', exact: true })
    .boundingBox();
  expect(target).not.toBeNull();
  await page.mouse.move(
    (target?.x ?? 0) + (target?.width ?? 0) / 2,
    (target?.y ?? 0) + (target?.height ?? 0) / 2,
    { steps: 12 },
  );
  await page.mouse.up();
  await expect(page.getByRole('status')).toHaveText('Eier liegt jetzt im Vorrat.');
  await page.getByRole('tab', { name: /Vorrat/ }).click();
  await expect(page.getByRole('link', { name: /Eier/ })).toBeVisible();
});

test.describe('with a finger', () => {
  test.use({ hasTouch: true });

  // A real touch drag, sent through the browser's input pipeline: without cancelling touchmove on
  // the held row (which select mode replaces), the browser would pan the list and cancel the drag.
  test('a long press and a drag up onto «Vorrat» moves the item', async ({ page }) => {
    for (const name of ['Eier', 'Saft']) {
      await addToFridge(page, name);
    }
    await page.goto('/inventory?location=fridge');
    const row = page.getByRole('link', { name: /Eier/ });
    await expect(row).toBeVisible();
    await expect
      .poll(async () => {
        const first = await row.boundingBox();
        await page.waitForTimeout(100);
        return JSON.stringify(first) === JSON.stringify(await row.boundingBox());
      })
      .toBe(true);
    const from = await row.boundingBox();
    expect(from).not.toBeNull();
    const x = (from?.x ?? 0) + 120;
    const y = (from?.y ?? 0) + (from?.height ?? 0) / 2;

    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', at: { x: number; y: number }) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x: Math.round(at.x), y: Math.round(at.y) }],
      });
    await touch('touchStart', { x, y });
    await page.waitForTimeout(700);
    // The finger is still down: select mode has turned the tabs into «Verschieben nach».
    const tab = await page
      .getByRole('group', { name: 'Verschieben nach' })
      .getByRole('button', { name: 'Vorrat', exact: true })
      .boundingBox();
    expect(tab).not.toBeNull();
    const toX = (tab?.x ?? 0) + (tab?.width ?? 0) / 2;
    const toY = (tab?.y ?? 0) + (tab?.height ?? 0) / 2;
    for (let step = 1; step <= 12; step += 1) {
      await touch('touchMove', { x: x + ((toX - x) * step) / 12, y: y + ((toY - y) * step) / 12 });
    }
    await touch('touchEnd', { x: toX, y: toY });
    await expect(page.getByRole('status')).toHaveText('Eier liegt jetzt im Vorrat.');
  });
});
