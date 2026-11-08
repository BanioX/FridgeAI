// Swiss products per shop from Open Food Facts (ODbL), for Migros and Coop whose websites block
// bots (ADR-0045). The search answers at most 10 pages of 100, so a shop with more products is
// split by food group (PNNS) and, where still too many, by Nutri-Score. One request every
// 7 seconds, as Open Food Facts asks for its search.
//
//   NODE_USE_ENV_PROXY=1 node scripts/catalog/off-stores.mjs out.jsonl [--stores migros,coop]
import { appendFileSync } from 'node:fs';
import { fetchText, sleep } from './polite.mjs';

const FIELDS = 'code,product_name,product_name_de,brands,quantity,categories_tags,stores_tags';
const GROUPS = [
  'beverages',
  'alcoholic-beverages',
  'cereals-and-potatoes',
  'composite-foods',
  'fat-and-sauces',
  'fish-meat-eggs',
  'fruits-and-vegetables',
  'milk-and-dairy-products',
  'salty-snacks',
  'sugary-snacks',
  'unknown',
];
const GRADES = ['a', 'b', 'c', 'd', 'e', 'unknown', 'not-applicable'];
const MAX_PAGES = 10;

const [out, flag, value] = process.argv.slice(2);
const stores =
  flag === '--stores' ? value.split(',') : ['migros', 'coop', 'denner', 'aldi', 'lidl'];
if (out === undefined) {
  throw new Error('usage: off-stores.mjs out.jsonl [--stores migros,coop]');
}

/**
 * Open Food Facts answers 503 when busy: wait and try again, up to three times, then skip this
 * query (null) instead of stopping the whole run.
 */
async function fetchJson(url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const data = JSON.parse(await fetchText(url));
      await sleep(7000);
      return data;
    } catch (error) {
      if (!String(error).includes('503')) throw error;
      await sleep(30000 * attempt);
    }
  }
  process.stdout.write(`skipped after three 503: ${url}\n`);
  return null;
}

const search = (filters, page) =>
  fetchJson(
    'https://world.openfoodfacts.org/api/v2/search?countries_tags_en=switzerland' +
      `${filters}&fields=${FIELDS}&page_size=100&page=${String(page)}`,
  );

/** All pages of one query; returns the total count Open Food Facts reports for it. */
async function collect(store, filters) {
  const first = await search(filters, 1);
  if (first === null) return 0;
  if (first.count > MAX_PAGES * 100) return first.count;
  let products = first.products ?? [];
  for (let page = 1; ; page += 1) {
    for (const product of products) {
      appendFileSync(out, `${JSON.stringify({ ...product, _store: store })}\n`);
    }
    if (products.length < 100 || page >= MAX_PAGES) return first.count;
    products = (await search(filters, page + 1))?.products ?? [];
  }
}

for (const store of stores) {
  const base = `&stores_tags=${store}`;
  const total = await collect(store, base);
  process.stdout.write(`${store}: ${String(total)} products\n`);
  if (total <= MAX_PAGES * 100) continue;
  for (const group of GROUPS) {
    const byGroup = `${base}&pnns_groups_1_tags=${group}`;
    const count = await collect(store, byGroup);
    if (count <= MAX_PAGES * 100) continue;
    for (const grade of GRADES) {
      const left = await collect(store, `${byGroup}&nutrition_grades_tags=${grade}`);
      if (left > MAX_PAGES * 100) {
        process.stdout.write(`${store} ${group} ${grade}: ${String(left)}, only partly\n`);
      }
    }
  }
}
