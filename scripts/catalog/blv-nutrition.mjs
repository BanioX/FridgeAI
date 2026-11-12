// Builds packages/core/src/nutrition/fresh-nutrition.data.ts (ADR-0064) from the Swiss Food
// Composition Database of the BLV (Schweizer Nährwertdatenbank, generic foods, Excel download from
// https://naehrwertdaten.ch/de/downloads/). The mapping of Rettich names to BLV foods lives in
// scripts/catalog/blv-fresh.json. The Excel file is not committed. No dependencies: the xlsx is
// a zip, read here with node:zlib. One food per line, so a refresh shows as a readable diff.
//
//   node scripts/catalog/blv-nutrition.mjs <blv.xlsx>
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

const file = process.argv[2];
if (file === undefined) {
  throw new Error('usage: blv-nutrition.mjs <blv.xlsx>');
}
const OUT = 'packages/core/src/nutrition/fresh-nutrition.data.ts';
const mapping = JSON.parse(readFileSync(new URL('./blv-fresh.json', import.meta.url), 'utf8'));

// Same rule as normalizeFoodText in packages/core/src/catalog/match.ts (a test keeps them equal).
const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// --- zip: central directory, then inflate each entry --------------------------------------------
function readZip(buf) {
  let end = buf.length - 22;
  while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(end + 10);
  let pos = buf.readUInt32LE(end + 16);
  const files = new Map();
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(pos + 10);
    const size = buf.readUInt32LE(pos + 20);
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const local = buf.readUInt32LE(pos + 42);
    const name = buf.toString('utf8', pos + 46, pos + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + size);
    files.set(name, method === 0 ? data : inflateRawSync(data));
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const unescapeXml = (text) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const files = readZip(readFileSync(file));
const text = (name) => {
  const data = files.get(name);
  if (data === undefined) throw new Error(`${name} missing in ${file}`);
  return data.toString('utf8');
};

// --- find the sheet «Generische Lebensmittel» ---------------------------------------------------
const workbook = text('xl/workbook.xml');
const sheetTag = [...workbook.matchAll(/<sheet\b[^>]*>/g)]
  .map((m) => m[0])
  .find((tag) => /name="Generische Lebensmittel"/.test(tag));
const rid = sheetTag === undefined ? null : /r:id="([^"]+)"/.exec(sheetTag)?.[1];
if (rid === null || rid === undefined) throw new Error('sheet «Generische Lebensmittel» not found');
const rels = [...text('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)].map(
  (m) => m[0],
);
const rel = rels.find((tag) => tag.includes(`Id="${rid}"`));
const target = rel === undefined ? null : /Target="([^"]+)"/.exec(rel)?.[1];
if (target === null || target === undefined) throw new Error('sheet file not found');
const sheet = text(`xl/${target.replace(/^\/?(xl\/)?/, '')}`);

const shared = [...text('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
  unescapeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')),
);

/** Rows as Map<column letters, value>; numbers stay numbers, texts stay texts. */
function* rows() {
  for (const row of sheet.matchAll(/<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = new Map();
    for (const cell of row[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const raw = /<v>([\s\S]*?)<\/v>/.exec(cell[3] ?? '')?.[1];
      if (raw === undefined) continue;
      cells.set(cell[1], / t="s"/.test(cell[2]) ? shared[Number(raw)] : Number(raw));
    }
    yield [Number(row[1]), cells];
  }
}

const all = [...rows()];
const title = String(all.find(([n]) => n === 1)?.[1].get('A') ?? '');
const version = /V\s*([\d.]+)\s*\((\d{2})\.(\d{2})\.(\d{4})\)/.exec(title);
if (version === null) throw new Error(`no version in the title: «${title}»`);
const header = all.find(([n]) => n === 3)?.[1];
if (header === undefined) throw new Error('header row 3 missing');

const FIELDS = [
  ['energyKcal', 'Energie, Kilokalorien (kcal)', 900],
  ['fat', 'Fett, total (g)', 100],
  ['saturatedFat', 'Fettsäuren, gesättigt (g)', 100],
  ['carbohydrates', 'Kohlenhydrate, verfügbar (g)', 100],
  ['sugars', 'Zucker (g)', 100],
  ['fiber', 'Nahrungsfasern (g)', 100],
  ['protein', 'Protein (g)', 100],
  ['salt', 'Salz (NaCl) (g)', 100],
];
const column = (label) => {
  const found = [...header].find(([, value]) => value === label);
  if (found === undefined) throw new Error(`column «${label}» missing`);
  return found[0];
};
const columns = FIELDS.map(([key, label, max]) => ({ key, col: column(label), max }));
const unit = column('Bezugseinheit');
const COL_ID = column('ID');
const COL_NAME = column('Name');

const foods = new Map();
for (const [n, cells] of all) {
  if (n > 3 && typeof cells.get(COL_ID) === 'number') foods.set(cells.get(COL_ID), cells);
}

const keywordOwner = new Map();
const lines = [];
for (const entry of mapping) {
  const cells = foods.get(entry.id);
  if (cells === undefined) throw new Error(`BLV id ${entry.id} not found`);
  const basis = String(cells.get(unit) ?? '');
  if (!/100\s*g/.test(basis)) throw new Error(`BLV id ${entry.id}: unexpected unit «${basis}»`);
  const nutrition = {};
  for (const { key, col, max } of columns) {
    const raw = cells.get(col);
    // «Sp.» (Spuren) is below 0.1 g and counts as 0; «k.A.» is unknown and stays out.
    const value = typeof raw === 'string' && raw.trim() === 'Sp.' ? 0 : raw;
    if (typeof value !== 'number') continue;
    if (value < 0 || value > max)
      throw new Error(`BLV id ${entry.id}: ${key}=${value} out of range`);
    nutrition[key] = Math.round(value * 100) / 100;
  }
  if (Object.keys(nutrition).length === 0) throw new Error(`BLV id ${entry.id}: no values`);
  const keywords = [...new Set(entry.keywords.map(normalize))];
  for (const keyword of keywords) {
    if (keywordOwner.has(keyword)) {
      throw new Error(
        `keyword «${keyword}» is used by ${keywordOwner.get(keyword)} and ${entry.id}`,
      );
    }
    keywordOwner.set(keyword, entry.id);
  }
  const food = String(cells.get(COL_NAME)).replace(/\s+/g, ' ').trim();
  const cat = entry.categories === undefined ? '' : `, cat: ${JSON.stringify(entry.categories)}`;
  lines.push(
    `  { id: ${entry.id}, food: ${JSON.stringify(food)}, kw: ${JSON.stringify(keywords)}${cat}, n: ${JSON.stringify(nutrition).replace(/"(\w+)":/g, '$1: ')} },`,
  );
}

const date = `${version[4]}-${version[3]}-${version[2]}`;
const out = `// Generated by scripts/catalog/blv-nutrition.mjs, do not edit by hand (ADR-0064).
// Source: Schweizer Nährwertdatenbank (BLV), Generische Lebensmittel V ${version[1]} (${date}),
// https://naehrwertdaten.ch, free to use with a source note, also commercially.
// Mapping: scripts/catalog/blv-fresh.json. Regenerate with
//   node scripts/catalog/blv-nutrition.mjs <Schweizer_Nahrwertdatenbank.xlsx>
// All values per 100 g edible portion, raw. A missing field is «k.A.» (unknown) in the database;
// «Sp.» (traces) is written as 0.

export const BLV_VERSION = ${JSON.stringify(`V ${version[1]}`)};
export const BLV_DATE = ${JSON.stringify(date)};

export interface FreshFoodRow {
  /** ID in the BLV database. */
  readonly id: number;
  /** Name in the BLV database. */
  readonly food: string;
  /** Normalised keywords (see normalizeFoodText). */
  readonly kw: readonly string[];
  /** Rettich categories that are this one food and name it without a keyword. */
  readonly cat?: readonly string[];
  readonly n: {
    readonly energyKcal?: number;
    readonly fat?: number;
    readonly saturatedFat?: number;
    readonly carbohydrates?: number;
    readonly sugars?: number;
    readonly fiber?: number;
    readonly protein?: number;
    readonly salt?: number;
  };
}

export const FRESH_FOODS: readonly FreshFoodRow[] = [
${lines.join('\n')}
];
`;
writeFileSync(OUT, out);
console.warn(`${lines.length} foods, ${keywordOwner.size} keywords -> ${OUT}`);
