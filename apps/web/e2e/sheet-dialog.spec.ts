import { AxeBuilder, expect, test } from './test';

/**
 * Sheets (ADR-0093): from the bottom on the phone, a dialog in the middle from 768 px. The sheet
 * «Wo liegt das?» stands for all of them, they share `sheet-backdrop` and `sheet-panel`.
 */
for (const { name, width, height, middle } of [
  { name: 'iPhone', width: 390, height: 844, middle: false },
  { name: 'iPad hochkant', width: 820, height: 1180, middle: true },
  { name: 'Computer', width: 1440, height: 900, middle: true },
  // An iPhone held sideways is wide but low: the dialog keeps a margin and scrolls inside.
  { name: 'iPhone quer', width: 852, height: 393, middle: true },
]) {
  test(`${name}: a sheet ${middle ? 'is a dialog in the middle' : 'comes from the bottom'}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/inventory/new');
    await page.getByLabel('Was ist es?').fill('Hackfleisch');
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await page.getByRole('link', { name: /Hackfleisch/ }).click();
    await page.getByRole('button', { name: 'Platz festhalten' }).click();
    const sheet = page.getByRole('dialog', { name: 'Wo liegt das?' });
    await expect(sheet).toBeVisible();
    const box = await sheet.boundingBox();
    if (box === null) {
      throw new Error('sheet is not visible');
    }
    const bottomGap = height - (box.y + box.height);
    if (middle) {
      // Space above and below, narrower than the page.
      expect(bottomGap).toBeGreaterThanOrEqual(16);
      expect(box.y).toBeGreaterThanOrEqual(16);
      expect(box.width).toBeLessThanOrEqual(512);
    } else {
      expect(bottomGap).toBeLessThanOrEqual(1);
      expect(box.width).toBe(width);
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
