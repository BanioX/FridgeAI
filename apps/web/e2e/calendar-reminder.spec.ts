import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('an item can go into the calendar as a reminder for the evening before', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByLabel('Was ist es?').fill('Joghurt');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page).not.toHaveURL(/\/inventory\/new$/);
  await page.goto('/inventory');
  await page
    .getByRole('link', { name: /Joghurt/ })
    .first()
    .click();
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Im Kalender erinnern' }).click(),
  ]);
  expect(file.suggestedFilename()).toBe('rettich-joghurt.ics');
  const text = await readFile(await file.path(), 'utf8');
  expect(text).toContain('BEGIN:VEVENT');
  expect(text).toContain('SUMMARY:Rettich: Joghurt läuft morgen ab');
  expect(text).toMatch(/DTSTART;TZID=Europe\/Zurich:\d{8}T180000/);
});
