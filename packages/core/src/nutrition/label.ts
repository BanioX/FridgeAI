import { NutritionSchema, type Nutrition } from '../model/inventory';

type NutrientKey = Exclude<keyof Nutrition, 'basis' | 'source'>;

/**
 * Label words by nutrient, as plain ASCII (accents and «ß» are folded before matching). One
 * alternation, most specific first, so «davon Zucker» wins over «Zucker» and «gesättigte
 * Fettsäuren» over «Fett».
 */
const LABELS: readonly (readonly [NutrientKey, string])[] = [
  [
    'saturatedFat',
    '(?:davon\\s+|dont\\s+|di\\s+cui\\s+|of\\s+which\\s+)?(?:gesattigte?\\s+fettsauren|acides?\\s+gras\\s+satures?|acidi\\s+grassi\\s+saturi|saturated\\s+fat|saturates)',
  ],
  [
    'sugars',
    '(?:davon\\s+|dont\\s+|di\\s+cui\\s+|of\\s+which\\s+)?(?:zucker|sucres|zuccheri|sugars?)',
  ],
  ['energyKcal', '(?:valeur\\s+energetique|valore\\s+energetico|energie|energia|energy|brennwert)'],
  ['fat', '(?:matieres?\\s+grasses?|fett|grassi|lipides|fat)'],
  ['carbohydrates', '(?:kohlenhydrate|glucides|carboidrati|carbohydrates?)'],
  ['fiber', '(?:ballaststoffe|nahrungsfasern|fibres?\\s+alimentaires?|fibres?|fibre|fiber)'],
  ['protein', '(?:eiweiss|protein(?:e|es|s)?)'],
  ['salt', '(?:salz|sel|sale|salt)'],
];

const LABEL_RE = new RegExp(
  `(?<![a-z])(?:${LABELS.map(([key, source]) => `(?<${key}>${source})`).join('|')})(?![a-z])`,
  'g',
);

const MIN_NUTRIENTS = 3;
const KJ_PER_KCAL = 4.184;
const GRAM_KEYS = [
  'fat',
  'saturatedFat',
  'carbohydrates',
  'sugars',
  'fiber',
  'protein',
  'salt',
] as const satisfies readonly NutrientKey[];

/** Typical OCR slips in numbers («O,5», «1O», «0,O»), stray table lines, Swiss thousands marks. */
function cleanOcr(text: string): string {
  return text
    .replace(/[|¦_]/g, ' ')
    .replace(/(?<=\d)[Oo](?=[\d.,]|\s*(?:g|mg|kj|kcal|ml)\b)/gi, '0')
    .replace(/(?<![A-Za-z])[Oo](?=[.,]\d)/g, '0')
    .replace(/(?<=[.,])[Oo](?![A-Za-z])/g, '0')
    .replace(/(?<![A-Za-z0-9])O(?=\s*g\b)/g, '0')
    .replace(/(?<=\d)['’](?=\d{3}\b)/g, '')
    .replace(/&lt;/g, '<');
}

function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').toLowerCase();
}

/** «pro/per/pour 100 ml» means per 100 ml; otherwise per 100 g. */
function basisOf(text: string): Nutrition['basis'] {
  const named = /(?:pro|per|pour|par|je|\/)\s*100\s*(g|ml)(?![a-z])/.exec(text);
  if (named?.[1] !== undefined) {
    return named[1] === 'ml' ? '100ml' : '100g';
  }
  return /100\s*ml(?![a-z])/.test(text) && !/100\s*g(?![a-z])/.test(text) ? '100ml' : '100g';
}

const NUMBER_RE = /(\d+(?:[.,]\d+)?)\s*(kj|kca[l1i]|mg|ml|g|%)?(?![a-z])/g;

function toNumber(text: string): number {
  return Number(text.replace(',', '.'));
}

/** The part of the segment that holds the value: its own line, or a number-only next line. */
function valueLine(segment: string): string {
  const [own = '', next = ''] = segment.split('\n');
  return /\d/.test(own) || !/^[^\p{L}\d<]*<?\s*\d/u.test(next) ? own : next;
}

function energyOf(line: string): number | undefined {
  const kcal = /(\d+(?:[.,]\d+)?)\s*kca[l1i]/.exec(line);
  if (kcal?.[1] !== undefined) {
    return toNumber(kcal[1]);
  }
  const kj = /(\d+(?:[.,]\d+)?)\s*kj/.exec(line);
  return kj?.[1] === undefined ? undefined : Math.round(toNumber(kj[1]) / KJ_PER_KCAL);
}

function gramsOf(line: string): number | undefined {
  for (const match of line.matchAll(NUMBER_RE)) {
    const unit = match[2];
    if (unit === 'kj' || unit === 'kcal' || unit === 'kca1' || unit === 'kcai' || unit === '%') {
      continue;
    }
    const value = toNumber(match[1] ?? '');
    return unit === 'mg' ? value / 1000 : value;
  }
  return undefined;
}

/**
 * Reads the nutrition table of a pack or a screenshot (Migipedia, coop.ch) from OCR text, in
 * German, French, Italian or English. Per label the first value on the same line counts (the
 * «pro 100 g» column comes before «pro Portion»); energy prefers kcal, else kJ / 4.184. Values
 * are clamped to the schema limits. Returns null when fewer than three nutrients are found, so a
 * receipt or a recipe is never mistaken for a table.
 */
export function parseNutritionLabel(text: string): Nutrition | null {
  const folded = fold(cleanOcr(text));
  const basis = basisOf(folded);
  const body = folded.replace(/(?:pro|per|pour|par|je|\/)\s*100\s*(?:g|ml)(?![a-z])/g, ' ');
  const labels = [...body.matchAll(LABEL_RE)];
  const found: Partial<Record<NutrientKey, number>> = {};
  labels.forEach((match, index) => {
    const key = LABELS.find(([name]) => match.groups?.[name] !== undefined)?.[0];
    if (key === undefined || found[key] !== undefined) {
      return;
    }
    const start = match.index + match[0].length;
    const segment = body.slice(start, labels[index + 1]?.index ?? body.length);
    const line = valueLine(segment);
    const value = key === 'energyKcal' ? energyOf(line) : gramsOf(line);
    if (value !== undefined) {
      found[key] = value;
    }
  });

  const nutrition: Record<string, unknown> = { basis, source: 'manual' };
  let count = 0;
  if (found.energyKcal !== undefined) {
    nutrition.energyKcal = Math.min(900, Math.round(found.energyKcal));
    count += 1;
  }
  for (const key of GRAM_KEYS) {
    const value = found[key];
    if (value !== undefined) {
      nutrition[key] = Math.min(100, Math.round(value * 100) / 100);
      count += 1;
    }
  }
  if (count < MIN_NUTRIENTS) {
    return null;
  }
  const parsed = NutritionSchema.safeParse(nutrition);
  return parsed.success ? parsed.data : null;
}
