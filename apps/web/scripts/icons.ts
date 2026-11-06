/**
 * Renders the PNG app icons from public/icon.svg (ADR-0021, home screen):
 *
 *   node scripts/icons.ts
 *
 * - apple-touch-icon.png (180 px, full bleed: iOS rounds the corners itself, transparent corners
 *   would turn black)
 * - icon-192.png and icon-512.png (rounded, for Android and desktop installs)
 * - icon-maskable-512.png (full bleed; the fridge stays inside the 80 % safe zone)
 *
 * The PNGs are committed; run this again only when icon.svg changes.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const publicDir = resolve(import.meta.dirname, '..', 'public');
const svg = await readFile(resolve(publicDir, 'icon.svg'), 'utf8');
const fullBleed = svg.replace('rx="112"', 'rx="0"');

const icons = [
  { file: 'apple-touch-icon.png', size: 180, source: fullBleed },
  { file: 'icon-192.png', size: 192, source: svg },
  { file: 'icon-512.png', size: 512, source: svg },
  { file: 'icon-maskable-512.png', size: 512, source: fullBleed },
];

const executablePath = process.env.PW_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
try {
  for (const { file, size, source } of icons) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const src = `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`;
    await page.setContent(
      `<body style="margin:0;background:transparent"><img src="${src}" width="${String(size)}" height="${String(size)}" style="display:block"></body>`,
    );
    await page.locator('img').evaluate((image: HTMLImageElement) => image.decode());
    await writeFile(
      resolve(publicDir, file),
      await page.screenshot({ type: 'png', omitBackground: true }),
    );
    await page.close();
    process.stdout.write(`${file} (${String(size)} px)\n`);
  }
} finally {
  await browser.close();
}
