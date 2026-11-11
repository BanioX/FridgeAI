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

function parsePart(raw: string): ParsedShoppingLine | undefined {
  let rest = raw.replace(/\uE000/g, ',').trim();
  for (let match = FILLER.exec(rest); match !== null; match = FILLER.exec(rest)) {
    rest = rest.slice(match[0].length);
  }
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

  const name = rest.replace(/\s+/gu, ' ').replace(/^[\s.:]+|[\s.:]+$/gu, '');
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
  for (const part of protectedText.split(SEPARATORS)) {
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
