// Public product facts from ALDI SUISSE (ADR-0045): robots.txt allows the product pages and
// names a product sitemap. Facts only (name, brand, size, categories, ingredients), no images.
//
//   NODE_USE_ENV_PROXY=1 node scripts/catalog/crawl-aldi.mjs out.jsonl [--limit 20]
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { Blocked, fetchText, robotsRules, sleep } from './polite.mjs';

const ORIGIN = 'https://www.aldi-suisse.ch';
const [out, flag, value] = process.argv.slice(2);
const limit = flag === '--limit' ? Number(value) : Infinity;
if (out === undefined) {
  throw new Error('usage: crawl-aldi.mjs out.jsonl [--limit n]');
}

/** Nuxt keeps the page data as one flat array whose objects point into it by index. */
function resolve(data, index, depth = 0) {
  const value = data[index];
  if (depth > 12) return null;
  if (Array.isArray(value)) {
    if (['Reactive', 'ShallowReactive', 'Ref', 'ShallowRef'].includes(value[0])) {
      return resolve(data, value[1], depth + 1);
    }
    return value.map((item) => (typeof item === 'number' ? resolve(data, item, depth + 1) : item));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        typeof item === 'number' ? resolve(data, item, depth + 1) : item,
      ]),
    );
  }
  return value;
}

const clean = (text) => (typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : undefined);

export function productOf(page) {
  const match =
    /<script type="application\/json"[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(page);
  if (match === null) return null;
  const data = JSON.parse(match[1]);
  const index = data.findIndex(
    (item) => item !== null && typeof item === 'object' && 'sku' in item && 'sellingSize' in item,
  );
  if (index < 0) return null;
  const product = resolve(data, index);
  return {
    sku: product.sku,
    name: clean(product.name),
    brand: clean(product.brandName),
    size: clean(product.sellingSize),
    categories: (product.categories ?? []).map((category) => clean(category?.name)).filter(Boolean),
    ingredients: clean(product.ingredients),
  };
}

const allowed = await robotsRules(ORIGIN);
const sitemap = await fetchText(`${ORIGIN}/de/sitemap_products.xml`);
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter(allowed);
const done = new Set(
  existsSync(out)
    ? readFileSync(out, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line).url)
    : [],
);
let count = 0;
for (const url of urls) {
  if (done.has(url) || count >= limit) continue;
  count += 1;
  await sleep(1500);
  try {
    const product = productOf(await fetchText(url));
    appendFileSync(out, `${JSON.stringify({ ...product, url })}\n`);
  } catch (error) {
    if (error instanceof Blocked) throw error;
    appendFileSync(out, `${JSON.stringify({ url, error: String(error).slice(0, 200) })}\n`);
  }
}
process.stdout.write(`${String(count)} pages read, ${String(urls.length)} in the sitemap\n`);
