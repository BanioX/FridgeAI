/**
 * Renders small phone-sized previews of app routes so every visible UI change can be reviewed.
 *
 * Usage:  pnpm preview:shots [route ...]      (default routes: / and /styleguide)
 *         A route prefixed with `!` is visited but not captured, e.g. `!/dev/seed` for demo data.
 * Output: apps/web/.previews/<timestamp>/sheet.png (all routes side by side) plus one PNG per route.
 *
 * Runs the Vite dev server (so development-only routes like /styleguide work) and Playwright.
 * Locally set PW_CHROMIUM_EXECUTABLE if the installed browser belongs to another Playwright version.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium, devices } from '@playwright/test';
import { createServer } from 'vite';

const requested = process.argv.slice(2).filter((arg) => /^!?\//.test(arg));
const routes = requested.length > 0 ? requested : ['/', '/styleguide'];

const appRoot = resolve(import.meta.dirname, '..');
const outDir = join(appRoot, '.previews', new Date().toISOString().replace(/[:.]/g, '-'));
await mkdir(outDir, { recursive: true });

const server = await createServer({
  root: appRoot,
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 5300, strictPort: false },
});
await server.listen();
const baseUrl = server.resolvedUrls?.local[0];
if (baseUrl === undefined) {
  throw new Error('Vite dev server did not report a local URL');
}

const executablePath = process.env.PW_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch(executablePath ? { executablePath } : {});

try {
  const phone = await browser.newContext({ ...devices['iPhone 14'], deviceScaleFactor: 2 });
  const page = await phone.newPage();
  const shots: { route: string; png: Buffer }[] = [];

  for (const entry of routes) {
    const visitOnly = entry.startsWith('!');
    const route = visitOnly ? entry.slice(1) : entry;
    await page.goto(new URL(route, baseUrl).href, { waitUntil: 'networkidle' });
    if (visitOnly) {
      await page
        .waitForURL((url) => url.pathname !== route, { timeout: 15_000 })
        .catch(() => undefined);
      continue;
    }
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot();
    const fileName = `${route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/[/?=&]/g, '-')}.png`;
    await writeFile(join(outDir, fileName), png);
    shots.push({ route, png });
  }

  // Contact sheet: all routes side by side at a compact size.
  const sheet = await browser.newPage({ deviceScaleFactor: 1.5 });
  const figures = shots
    .map(
      ({ route, png }) =>
        `<figure><img src="data:image/png;base64,${png.toString('base64')}"><figcaption>${route}</figcaption></figure>`,
    )
    .join('');
  await sheet.setContent(
    `<style>body{margin:0;padding:24px;display:flex;gap:24px;background:#e4dfd3;font:14px system-ui}
      figure{margin:0;text-align:center}img{width:300px;border-radius:24px;box-shadow:0 8px 24px #0002}
      figcaption{margin-top:8px;color:#5b635d}</style>${figures}`,
  );
  await sheet.setViewportSize({ width: shots.length * 324 + 24, height: 100 });
  await sheet.screenshot({ path: join(outDir, 'sheet.png'), fullPage: true });

  process.stdout.write(`Previews written to ${outDir}\n`);
} finally {
  await browser.close();
  await server.close();
}
