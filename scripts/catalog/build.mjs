// Builds the catalog files the app loads (ADR-0045) from the raw crawls:
//   apps/web/public/catalog/off-ch.json     Open Food Facts, ODbL, with barcodes
//   apps/web/public/catalog/retail-ch.json  facts from shop websites (today ALDI SUISSE)
// One product per line, so a refresh shows as a readable diff.
//
//   node scripts/catalog/build.mjs <off.jsonl> <aldi.jsonl>
import { readFileSync, writeFileSync } from 'node:fs';

const [offFile, aldiFile] = process.argv.slice(2);
if (offFile === undefined || aldiFile === undefined) {
  throw new Error('usage: build.mjs off.jsonl aldi.jsonl');
}
const OUT = 'apps/web/public/catalog';
const today = new Date().toISOString().slice(0, 10);
const lines = (file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
const clean = (text) =>
  typeof text === 'string' && text.trim() !== '' ? text.replace(/\s+/g, ' ').trim() : null;

// Open Food Facts: one row per barcode, with every Swiss shop that sells it.
const byCode = new Map();
for (const product of lines(offFile)) {
  const name = clean(product.product_name_de) ?? clean(product.product_name);
  if (!/^\d{8,14}$/.test(product.code ?? '') || name === null) continue;
  const known = byCode.get(product.code);
  if (known !== undefined) {
    known.shops.add(product._store);
    continue;
  }
  byCode.set(product.code, {
    gtin: product.code,
    name: name.slice(0, 120),
    brand: clean(product.brands?.split(',')[0])?.slice(0, 80) ?? null,
    size: clean(product.quantity)?.slice(0, 30) ?? null,
    hints: (product.categories_tags ?? []).slice(-3).map((tag) => tag.replace(/^\w\w:/, '')),
    shops: new Set([product._store]),
  });
}
const off = [...byCode.values()]
  .map((row) => [row.gtin, row.name, row.brand, row.size, row.hints, [...row.shops].sort()])
  .sort((a, b) => a[1].localeCompare(b[1], 'de'));

// Shop websites: facts only, no images, no texts (ADR-0045). Food only: a product needs one of
// the shop's food categories (Aldi's «Aktionen» also hold boots and lamps).
const FOOD = new Set([
  'Vorräte',
  'Fleisch',
  'Fisch',
  'Milchprodukte & Eier',
  'Gekühlte Produkte',
  'Tiefgekühlte Produkte',
  'Brot & Backwaren',
  'Frühstück',
  'Süssigkeiten & Snacks',
  'Alkoholfreie Getränke',
  'Alkohol & Tabakwaren',
  'Grillen',
  'Vegetarisch & Vegan',
  'Gourmet',
  'Saveurs Suisses',
  'Retour aux sources (Bio)',
  'Früchte & Gemüse',
]);
const retail = lines(aldiFile)
  .filter((row) => clean(row.name) !== null && row.sku !== undefined)
  .filter((row) => (row.categories ?? []).some((category) => FOOD.has(category)))
  .map((row) => [
    `aldi:${row.sku}`,
    clean(row.name).slice(0, 120),
    clean(row.brand)?.slice(0, 80) ?? null,
    clean(row.size)?.slice(0, 30) ?? null,
    (row.categories ?? []).filter((category) => category !== 'Aktionen').slice(0, 3),
    ['aldi'],
  ])
  .sort((a, b) => a[1].localeCompare(b[1], 'de'));

const write = (file, header, rows) =>
  writeFileSync(
    `${OUT}/${file}`,
    `{${Object.entries(header)
      .map(([key, value]) => `${JSON.stringify(key)}:${JSON.stringify(value)}`)
      .join(',')},"columns":["id","name","brand","size","hints","shops"],"products":[\n` +
      rows.map((row) => JSON.stringify(row)).join(',\n') +
      '\n]}\n',
  );

write(
  'off-ch.json',
  {
    built: today,
    source: 'Open Food Facts, https://world.openfoodfacts.org',
    license: 'Open Database License (ODbL) 1.0, https://opendatacommons.org/licenses/odbl/1-0/',
  },
  off,
);
write(
  'retail-ch.json',
  { built: today, source: 'Public product pages of www.aldi-suisse.ch (facts only, ADR-0045)' },
  retail,
);
process.stdout.write(
  `off-ch.json: ${String(off.length)} products, retail-ch.json: ${String(retail.length)}\n`,
);
