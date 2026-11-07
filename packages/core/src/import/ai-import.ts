import { z } from 'zod';
import { parseDateInput } from '../dates';
import {
  ContainerSchema,
  StorageLocationSchema,
  type Container,
  type LocalDate,
  type StorageLocation,
  type Unit,
} from '../model/primitives';
import { toBaseQuantity, type InputUnit } from '../quantity';

/**
 * «Mit eigener KI erfassen» (ADR-0012, stage 1): rettich hands out a prompt, the person's own AI
 * (ChatGPT, Claude, Gemini …) reads a photo and answers in this format, the answer is pasted back
 * and parsed here. The pasted text is untrusted: everything is validated, nothing is stored without
 * the person confirming each item in the review list.
 */

/** Upper bounds against accidental or hostile pastes. */
export const AI_IMPORT_MAX_TEXT = 20_000;
export const AI_IMPORT_MAX_ITEMS = 100;

/** The prompt to copy into the AI, with today's date for reading short dates. */
export function aiImportPrompt(today: LocalDate): string {
  return [
    'Du hilfst mir, Lebensmittel in die App rettich zu übertragen.',
    'Schau dir das Foto an (Kühlschrank, Einkauf oder Kassenbon) und liste jedes Lebensmittel auf.',
    '',
    'Antworte NUR mit einem JSON-Codeblock in genau diesem Format, ohne weiteren Text:',
    '{"fridgeai":1,"items":[{"name":"Vollmilch","quantity":1,"unit":"l","location":"fridge","expiresOn":"2026-11-20"}]}',
    '',
    'Regeln:',
    '- name: kurzer deutscher Name, z. B. «Grana Padano», «Bananen»',
    '- quantity und unit: Menge mit Einheit pcs (Stück), g, kg, ml, dl oder l',
    '- location: fridge (Kühlschrank), freezer (Tiefkühler), pantry (Vorrat) oder reserve (Notvorrat); weglassen, wenn unklar',
    `- expiresOn: nur wenn ein Datum lesbar ist, als JJJJ-MM-TT; sonst weglassen. Heute ist der ${today}.`,
    '- Nichts erfinden: Was du nicht sicher erkennst, lässt du weg.',
    '- Keine Haushaltsartikel wie Putzmittel oder Toilettenpapier.',
  ].join('\n');
}

/** One recognised item, ready for the review list (quantity in base units). */
export interface AiImportItem {
  name: string;
  quantity: number;
  unit: Unit;
  location?: StorageLocation;
  expiresOn?: LocalDate;
  container?: Container;
}

export interface AiImportResult {
  items: AiImportItem[];
  /** Entries that could not be read, to show the person what was left out. */
  skipped: { entry: string; reason: 'invalid' | 'too_many' }[];
  /** The text was neither the JSON nor the line format. */
  unreadable: boolean;
}

const UNIT_WORDS: Record<string, InputUnit> = {
  pcs: 'pcs',
  stk: 'pcs',
  'stk.': 'pcs',
  stück: 'pcs',
  stueck: 'pcs',
  x: 'pcs',
  g: 'g',
  gr: 'g',
  kg: 'kg',
  ml: 'ml',
  cl: 'cl',
  dl: 'dl',
  l: 'l',
  liter: 'l',
};

/** Pack words count pieces: «2 Becher» = 2 pieces in a cup. */
const CONTAINER_WORDS: Record<string, Container> = {
  becher: 'cup',
  packung: 'pack',
  packungen: 'pack',
  pack: 'pack',
  flasche: 'bottle',
  flaschen: 'bottle',
  dose: 'can',
  dosen: 'can',
  glas: 'jar',
  gläser: 'jar',
  bund: 'bunch',
  beutel: 'bag',
  sack: 'bag',
  schachtel: 'box',
  box: 'box',
};

const LOCATION_WORDS: Record<string, StorageLocation> = {
  fridge: 'fridge',
  kühlschrank: 'fridge',
  freezer: 'freezer',
  tiefkühler: 'freezer',
  gefrierfach: 'freezer',
  tk: 'freezer',
  pantry: 'pantry',
  vorrat: 'pantry',
  schrank: 'pantry',
  keller: 'pantry',
  reserve: 'reserve',
  notvorrat: 'reserve',
};

const word = (text: string) => text.trim().toLowerCase();

function toUnit(text: string | undefined): InputUnit | undefined {
  return text === undefined ? undefined : UNIT_WORDS[word(text)];
}

function toLocation(text: string | undefined): StorageLocation | undefined {
  if (text === undefined || text.trim() === '') {
    return undefined;
  }
  return LOCATION_WORDS[word(text)] ?? StorageLocationSchema.safeParse(word(text)).data;
}

/** Visible characters only, at most 120: names end up in lists and notifications. */
function cleanName(text: string): string | null {
  const name = text
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return name === '' ? null : name.slice(0, 120);
}

const JsonItemSchema = z.object({
  name: z.string(),
  quantity: z.number().positive().max(100_000).optional(),
  unit: z.string().optional(),
  location: z.string().optional(),
  expiresOn: z.string().optional(),
  container: ContainerSchema.optional(),
});

function toItem(
  raw: {
    name: string;
    quantity?: number | undefined;
    unit?: string | undefined;
    location?: string | undefined;
    expiresOn?: string | undefined;
    container?: Container | undefined;
  },
  today: LocalDate,
): AiImportItem | null {
  const name = cleanName(raw.name);
  const packedIn = raw.unit === undefined ? undefined : CONTAINER_WORDS[word(raw.unit)];
  const unit = raw.unit === undefined || packedIn !== undefined ? 'pcs' : toUnit(raw.unit);
  const container = raw.container ?? packedIn;
  if (name === null || unit === undefined) {
    return null;
  }
  const base = toBaseQuantity(raw.quantity ?? 1, unit);
  const location = toLocation(raw.location);
  const expiresOn =
    raw.expiresOn === undefined || raw.expiresOn.trim() === ''
      ? undefined
      : (parseDateInput(raw.expiresOn, today) ?? undefined);
  return {
    name,
    quantity: base.quantity,
    unit: base.unit,
    ...(location === undefined ? {} : { location }),
    ...(expiresOn === undefined ? {} : { expiresOn }),
    ...(container === undefined ? {} : { container }),
  };
}

/** «500 g», «1,5 l», «6 Stk», «6», «Stk» → amount and unit. */
function parseAmount(text: string): { quantity?: number; unit?: string } | null {
  const match = /^(\d+(?:[.,]\d+)?)?\s*([a-zäöü.]*)$/i.exec(text.trim());
  if (match === null) {
    return null;
  }
  const quantity = match[1] === undefined ? undefined : Number(match[1].replace(',', '.'));
  const unit = match[2] === '' ? undefined : match[2];
  return {
    ...(quantity === undefined || quantity <= 0 ? {} : { quantity }),
    ...(unit === undefined ? {} : { unit }),
  };
}

/** `{"items": [...]}` as asked for, or a bare array. */
const JsonListSchema = z.union([
  z.array(z.unknown()),
  z.object({ items: z.array(z.unknown()) }).transform((value) => value.items),
]);

/** The first JSON object or array in the text (AIs like to wrap it in ```json fences). */
function extractJson(text: string): unknown {
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (start === -1 || end <= start) {
    return undefined;
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

/**
 * Reads the AI's answer: the JSON format from `aiImportPrompt` (also a bare array), or one item
 * per line as «Name; Menge; Lagerort; Datum» (separators `;`, `|` or tab, bullets allowed).
 */
export function parseAiImport(input: string, today: LocalDate): AiImportResult {
  const text = input.slice(0, AI_IMPORT_MAX_TEXT);
  const items: AiImportItem[] = [];
  const skipped: AiImportResult['skipped'] = [];
  const add = (entry: string, item: AiImportItem | null) => {
    if (item === null) {
      skipped.push({ entry: entry.slice(0, 80), reason: 'invalid' });
    } else if (items.length >= AI_IMPORT_MAX_ITEMS) {
      skipped.push({ entry: item.name, reason: 'too_many' });
    } else {
      items.push(item);
    }
  };

  const list = JsonListSchema.safeParse(extractJson(text));
  if (list.success) {
    for (const entry of list.data) {
      const parsed = JsonItemSchema.safeParse(entry);
      add(JSON.stringify(entry), parsed.success ? toItem(parsed.data, today) : null);
    }
    return { items, skipped, unreadable: false };
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim();
    if (line === '' || line.startsWith('#') || line.startsWith('```')) {
      continue;
    }
    // Lines without a separator are the AI's chatter («Hier ist die Liste:»), not items.
    if (!/[;|\t]/.test(line)) {
      continue;
    }
    const [name = '', amount = '', location, date] = line.split(/\s*[;|\t]\s*/);
    const parsedAmount = parseAmount(amount);
    add(
      line,
      parsedAmount === null
        ? null
        : toItem({ name, ...parsedAmount, location, expiresOn: date }, today),
    );
  }
  return { items, skipped, unreadable: items.length === 0 };
}
