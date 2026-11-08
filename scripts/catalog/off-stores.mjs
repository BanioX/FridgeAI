// Swiss products per shop from Open Food Facts (ODbL), for Migros and Coop whose websites block
// bots (ADR-0045). The search API answers at most 1'000 products per query; one request every
// 7 seconds, as Open Food Facts asks for its search.
//
//   NODE_USE_ENV_PROXY=1 node scripts/catalog/off-stores.mjs out.jsonl [--pages n]
import { appendFileSync } from 'node:fs';
import { fetchText, sleep } from './polite.mjs';

const STORES = ['migros', 'coop', 'denner', 'aldi', 'lidl'];
const FIELDS = 'code,product_name,product_name_de,brands,quantity,categories_tags,stores_tags';
const [out, flag, value] = process.argv.slice(2);
const maxPages = flag === '--pages' ? Number(value) : 10;
if (out === undefined) {
  throw new Error('usage: off-stores.mjs out.jsonl [--pages n]');
}

/** Open Food Facts answers 503 when busy: wait and try again, up to three times. */
async function fetchJson(url) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return JSON.parse(await fetchText(url));
    } catch (error) {
      if (attempt >= 3 || !String(error).includes('503')) throw error;
      await sleep(30000 * attempt);
    }
  }
}

for (const store of STORES) {
  for (let page = 1; page <= maxPages; page += 1) {
    const url =
      'https://world.openfoodfacts.org/api/v2/search?countries_tags_en=switzerland' +
      `&stores_tags=${store}&fields=${FIELDS}&page_size=100&page=${String(page)}`;
    const data = await fetchJson(url);
    await sleep(7000);
    const products = data.products ?? [];
    for (const product of products) {
      appendFileSync(out, `${JSON.stringify({ ...product, _store: store })}\n`);
    }
    process.stdout.write(`${store} ${String(page)} ${String(products.length)}\n`);
    if (products.length < 100) break;
  }
}
