import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './test';

const executablePath = process.env.PW_CHROMIUM_EXECUTABLE;
// A fake camera, so «Kamera starten» meets a real device and the permission decides.
test.use({
  launchOptions: {
    args: ['--use-fake-device-for-media-stream'],
    ...(executablePath ? { executablePath } : {}),
  },
});

// Open Food Facts is never called for real in tests: unknown by default, a product where needed.
test.beforeEach(async ({ page }) => {
  await page.route('https://world.openfoodfacts.org/**', (route) =>
    route.fulfill({ status: 404, json: { status: 0 } }),
  );
});

/** EAN-13 as bars (1 = black module): the real encoding, so ZXing reads it like a pack. */
function ean13Modules(code: string): string {
  const L = ['0001101', '0011001', '0010011', '0111101', '0100011'];
  L.push('0110001', '0101111', '0111011', '0110111', '0001011');
  const G = L.map((bits) =>
    Array.from(bits)
      .reverse()
      .map((b) => (b === '1' ? '0' : '1'))
      .join(''),
  );
  const R = L.map((bits) =>
    Array.from(bits)
      .map((b) => (b === '1' ? '0' : '1'))
      .join(''),
  );
  const parity = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG'];
  parity.push('LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL');
  const digits = Array.from(code, Number);
  const pattern = parity[digits[0] ?? 0] ?? '';
  const left = digits
    .slice(1, 7)
    .map((d, i) => (pattern[i] === 'G' ? G[d] : L[d]))
    .join('');
  const right = digits
    .slice(7)
    .map((d) => R[d])
    .join('');
  return `101${left}01010${right}101`;
}

/** Draws the code on a canvas in the page and returns it as a PNG, like a phone photo. */
async function barcodePhoto(page: Page, code: string): Promise<Buffer> {
  const dataUrl = await page.evaluate((modules) => {
    const scale = 4;
    const quiet = 12;
    const canvas = document.createElement('canvas');
    canvas.width = (modules.length + quiet * 2) * scale;
    canvas.height = 220;
    const context = canvas.getContext('2d');
    if (context === null) {
      throw new Error('no canvas');
    }
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000';
    Array.from(modules).forEach((bit, index) => {
      if (bit === '1') {
        context.fillRect((quiet + index) * scale, 20, scale, 180);
      }
    });
    return canvas.toDataURL('image/png');
  }, ean13Modules(code));
  return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64');
}

test('reads a barcode from a photo with the self-hosted reader', async ({ page }) => {
  const cspErrors: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) {
      cspErrors.push(message.text());
    }
  });
  await page.goto('/inventory/new');
  await page.getByRole('button', { name: 'Barcode scannen' }).click();
  await page.getByLabel('Code aus Foto lesen').setInputFiles({
    name: 'code.png',
    mimeType: 'image/png',
    buffer: await barcodePhoto(page, '7610000000004'),
  });
  await expect(page.getByText('Barcode 7610000000004 erkannt.')).toBeVisible();
  await expect(page.getByLabel('Was ist es?')).toBeFocused();
  expect(cspErrors).toEqual([]);
});

test('takes the date from a typed GS1 code', async ({ page }) => {
  // From the «Scannen» tab the scanner is already open in the add form.
  await page.goto('/scan');
  await page.getByRole('link', { name: 'Barcode scannen' }).click();
  await page.getByLabel('Nummer unter dem Strichcode').fill('(01)07610000000004(17)271231');
  await page.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(
    page.getByText('Barcode 7610000000004 erkannt, haltbar bis 31.12.2027.'),
  ).toBeVisible();
  await expect(page.getByLabel('Haltbar bis')).toHaveValue('31.12.2027');
  await expect(page.getByText('geschätzt', { exact: true })).toHaveCount(0);
});

test('explains a blocked camera and keeps the other ways open', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByRole('button', { name: 'Barcode scannen' }).click();
  await page.getByRole('button', { name: 'Kamera starten' }).click();
  await expect(page.getByText(/Die Kamera ist blockiert/)).toBeVisible();
  await expect(page.getByLabel('Code aus Foto lesen')).toBeAttached();
  // Without «capture», phones offer the photo library as well as the camera.
  await expect(page.getByLabel('Code aus Foto lesen')).not.toHaveAttribute('capture');
  await expect(page.getByLabel('Nummer unter dem Strichcode')).toBeVisible();
});

test.describe('with camera permission', () => {
  test.use({ permissions: ['camera'] });

  test('starts the live camera and stops it again', async ({ page }) => {
    await page.goto('/inventory/new');
    await page.getByRole('button', { name: 'Barcode scannen' }).click();
    await page.getByRole('button', { name: 'Kamera starten' }).click();
    await expect(
      page.getByText(/^Code in den Rahmen, Handy etwa 20 cm entfernt halten/),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Kamera stoppen' }).click();
    await expect(page.getByRole('button', { name: 'Kamera starten' })).toBeVisible();
  });
});

test('fills in the product from Open Food Facts and knows it offline next time', async ({
  page,
}) => {
  let requests = 0;
  await page.route('https://world.openfoodfacts.org/**', (route) => {
    requests += 1;
    return route.fulfill({
      json: {
        status: 1,
        product: {
          product_name_de: 'Vollmilch',
          brands: 'Alpenhof',
          quantity: '1 l',
          nutriments: { 'energy-kcal_100g': 64, fat_100g: 3.5, proteins_100g: 3.3 },
          nutriscore_grade: 'b',
          allergens_tags: ['en:milk'],
          image_front_small_url:
            'https://images.openfoodfacts.org/images/products/761/000/000/0004/front_de.3.200.png',
        },
      },
    });
  });
  // A 1×1 PNG stands in for the pack picture.
  let pictures = 0;
  await page.route('https://images.openfoodfacts.org/**', (route) => {
    pictures += 1;
    return route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
  });
  const scan = async () => {
    await page.getByRole('button', { name: 'Barcode scannen' }).click();
    await page.getByLabel('Nummer unter dem Strichcode').fill('7610000000004');
    await page.getByRole('button', { name: 'Übernehmen' }).click();
  };

  await page.goto('/inventory/new');
  await scan();
  await expect(page.getByText('Gefunden: Vollmilch (Alpenhof, 1 l).')).toBeVisible();
  await expect(page.getByLabel('Was ist es?')).toHaveValue('Vollmilch');
  await expect(page.getByLabel('Kategorie')).toHaveValue('dairy-milk');
  await expect(page.getByLabel('Menge')).toHaveValue('1');
  await expect(page.getByLabel('Einheit')).toHaveValue('l');
  await expect(page.getByRole('link', { name: 'Daten: Open Food Facts (ODbL)' })).toBeVisible();
  await page.getByRole('button', { name: 'Speichern und nächsten erfassen' }).click();
  await expect(page.getByText('Vollmilch ist gespeichert.')).toBeVisible();

  // Second scan: the household knows the product with its facts, no request; the facts still
  // come from Open Food Facts, so the attribution stays (ODbL).
  await scan();
  await expect(page.getByText('Gefunden: Vollmilch (Alpenhof, 1 l).')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Daten: Open Food Facts (ODbL)' })).toBeVisible();
  expect(requests).toBe(1);

  // The list and the detail page show the pack picture, downloaded once; the detail page also
  // shows the product facts, folded away until asked for.
  await page.goto('/inventory');
  await expect(
    page.getByRole('link', { name: /Vollmilch/ }).locator('img[src^="data:image/png;base64,"]'),
  ).toBeVisible();
  await page.getByRole('link', { name: /Vollmilch/ }).click();
  await expect(page.getByText('Alpenhof · 1 l')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Bild: Open Food Facts (CC BY-SA)' })).toBeVisible();
  expect(pictures).toBe(1);
  await page.getByText('Nährwerte und Allergene').click();
  await expect(page.getByText('Nutri-Score B')).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'Eiweiss' })).toBeVisible();
  await expect(page.getByText('3.3 g')).toBeVisible();
  await expect(page.locator('p', { hasText: 'Enthält:' })).toHaveText('Enthält: Milch');
  const facts = await new AxeBuilder({ page }).analyze();
  expect(facts.violations).toEqual([]);
});

test('asks for the name when nobody knows the product', async ({ page }) => {
  await page.goto('/inventory/new');
  await page.getByRole('button', { name: 'Barcode scannen' }).click();
  await page.getByLabel('Nummer unter dem Strichcode').fill('7610000000004');
  await page.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(page.getByText(/Produkt noch unbekannt/)).toBeVisible();
  await expect(page.getByLabel('Was ist es?')).toBeFocused();
});
