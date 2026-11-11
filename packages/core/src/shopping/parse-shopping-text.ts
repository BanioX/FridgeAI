import { matchCategoryByName } from '../catalog/match';
import type { InputUnit } from '../quantity';

/** One shopping list entry read from a free sentence (K14). Quantity and unit only when given. */
export interface ParsedShoppingLine {
  name: string;
  quantity?: number;
  unit?: InputUnit;
}

const UNITS: Record<string, InputUnit> = {
  g: 'g',
  gr: 'g',
  gramm: 'g',
  kg: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kilogramm: 'kg',
  ml: 'ml',
  cl: 'cl',
  dl: 'dl',
  l: 'l',
  liter: 'l',
  milliliter: 'ml',
  zentiliter: 'cl',
  deziliter: 'dl',
  stück: 'pcs',
  stücke: 'pcs',
  stk: 'pcs',
  x: 'pcs',
  pack: 'pcs',
  packung: 'pcs',
  packungen: 'pcs',
};

const NUMBER_WORDS: Record<string, number> = {
  eins: 1,
  ein: 1,
  eine: 1,
  einen: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
  elf: 11,
  zwölf: 12,
};

const UNIT_PATTERN = Object.keys(UNITS)
  .sort((a, b) => b.length - a.length)
  .join('|');
const WORD_END = '(?!\\p{L})';
const SEPARATORS = /[;\n\r]+|,|\s+(?:und|sowie|plus)\s+|\s+&\s+/iu;
const FILLER =
  /^(?:(?:ich|wir)\s+(?:brauche|brauchen|brauch|muss|müssen)|bitte|noch|kaufen|einkaufen|zu\s+kaufen)(?!\p{L})[\s:]*/iu;
const HALF = new RegExp(`^(?:(?:ein|eine)\\s+)?halb(?:es|e|en|er)${WORD_END}\\s*`, 'iu');
const FEW = new RegExp(`^ein\\s+paar${WORD_END}\\s*`, 'iu');
const DIGITS = /^(\d+(?:[.,]\d+)?)\s*/u;
const WORD = new RegExp(`^(${Object.keys(NUMBER_WORDS).join('|')})${WORD_END}\\s*`, 'iu');
const UNIT = new RegExp(`^(${UNIT_PATTERN})${WORD_END}[\\s.]*`, 'iu');

const round = (value: number) => Math.round(value * 1e6) / 1e6;
/** The contract allows names up to 80 characters. */
const MAX_NAME = 80;

const has = (table: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(table, key);
const isNumberToken = (token: string) =>
  /^\d+(?:[.,\uE000]\d+)?$/u.test(token) || has(NUMBER_WORDS, token.toLowerCase());
const isQuantityToken = (token: string) => {
  const lower = token.toLowerCase().replace(/\.$/u, '');
  return (
    isNumberToken(token) ||
    has(UNITS, lower) ||
    lower === 'paar' ||
    /^halb(?:es|e|en|er)$/u.test(lower)
  );
};

function stripFiller(text: string): string {
  let rest = text.trim();
  for (let match = FILLER.exec(rest); match !== null; match = FILLER.exec(rest)) {
    rest = rest.slice(match[0].length);
  }
  return rest;
}

/**
 * Dictation rarely writes commas: «Milch Eier Brot» or «Milch 2 Joghurt» arrive as one part.
 * A number starts a new product once a word came before it, and a run of words is split only
 * when every word is a known food on its own, so «Zürcher Geschnetzeltes» and «Grüne Bohnen»
 * stay together.
 */
function splitRun(part: string): string[] {
  const tokens = stripFiller(part)
    .split(/\s+/u)
    .filter((token) => token !== '');
  const chunks: string[][] = [];
  let current: string[] = [];
  for (const token of tokens) {
    if (isNumberToken(token) && current.some((word) => !isQuantityToken(word))) {
      chunks.push(current);
      current = [];
    }
    current.push(token);
  }
  chunks.push(current);
  // «Rahm 2 dl»: an amount after the product belongs to it.
  const joined: string[][] = [];
  for (const chunk of chunks) {
    const previous = joined[joined.length - 1];
    if (previous !== undefined && chunk.every(isQuantityToken)) {
      joined[joined.length - 1] = [...chunk, ...previous];
    } else {
      joined.push(chunk);
    }
  }
  return joined.flatMap((chunk) => {
    const prefixLength = chunk.findIndex((token) => !isQuantityToken(token));
    const prefix = prefixLength === -1 ? chunk : chunk.slice(0, prefixLength);
    const words = prefixLength === -1 ? [] : chunk.slice(prefixLength);
    const allFood = words.length >= 2 && words.every((word) => matchCategoryByName(word) !== null);
    if (!allFood) {
      return [chunk.join(' ')];
    }
    return words.map((word, index) => (index === 0 ? [...prefix, word] : [word]).join(' '));
  });
}

function parsePart(raw: string): ParsedShoppingLine | undefined {
  let rest = stripFiller(raw.replace(/\uE000/g, ','));
  rest = rest.replace(/[.:\s]+$/u, '').trim();

  let quantity: number | undefined;
  const few = FEW.exec(rest);
  if (few !== null) {
    rest = rest.slice(few[0].length);
  } else {
    const half = HALF.exec(rest);
    const digits = half === null ? DIGITS.exec(rest) : null;
    const word = half === null && digits === null ? WORD.exec(rest) : null;
    const found = half ?? digits ?? word;
    if (found !== null) {
      rest = rest.slice(found[0].length);
      quantity =
        half !== null
          ? 0.5
          : digits !== null
            ? Number((digits[1] ?? '').replace(',', '.'))
            : NUMBER_WORDS[(word?.[1] ?? '').toLowerCase()];
    }
  }

  let unit: InputUnit | undefined;
  if (quantity !== undefined) {
    const found = UNIT.exec(rest);
    if (found !== null) {
      unit = UNITS[(found[1] ?? '').toLowerCase()];
      rest = rest.slice(found[0].length);
    }
    if (!(quantity > 0)) {
      quantity = undefined;
    } else {
      unit ??= 'pcs';
    }
  }

  const name = rest
    .replace(/\s+/gu, ' ')
    .replace(/^[\s.:]+|[\s.:]+$/gu, '')
    .slice(0, MAX_NAME)
    .trim();
  if (name === '') {
    return undefined;
  }
  const shown = name.charAt(0).toLocaleUpperCase('de-CH') + name.slice(1);
  return quantity === undefined || unit === undefined
    ? { name: shown }
    : { name: shown, quantity, unit };
}

/**
 * Turns one free sentence like «Milch, 2 Joghurt, ein Brot und 500 g Hackfleisch sowie Eier» into
 * one line per product (K14). Pure text work, nothing leaves the device. The same product twice
 * becomes one line; quantities are added only if their units match.
 */
export function parseShoppingText(text: string): ParsedShoppingLine[] {
  const protectedText = text.replace(/(\d),(\d)/g, '$1\uE000$2');
  const lines: ParsedShoppingLine[] = [];
  const seen = new Map<string, number>();
  for (const part of protectedText.split(SEPARATORS).flatMap(splitRun)) {
    const line = parsePart(part);
    if (line === undefined) {
      continue;
    }
    const key = line.name.toLocaleLowerCase('de-CH');
    const index = seen.get(key);
    const earlier = index === undefined ? undefined : lines[index];
    if (index === undefined || earlier === undefined) {
      seen.set(key, lines.length);
      lines.push(line);
    } else if (earlier.quantity === undefined) {
      if (line.quantity !== undefined && line.unit !== undefined) {
        lines[index] = { name: earlier.name, quantity: line.quantity, unit: line.unit };
      }
    } else if (line.unit === earlier.unit && line.quantity !== undefined) {
      lines[index] = { ...earlier, quantity: round(earlier.quantity + line.quantity) };
    }
  }
  return lines;
}
