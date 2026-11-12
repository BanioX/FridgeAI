import { addDays, addYears, localDate } from './dates';
import type { DateKind, LocalDate } from './model/primitives';

/** What a photo of the printed date yields: the day, and the kind when a keyword names it. */
export interface ExpiryFromText {
  date: LocalDate;
  kind?: DateKind;
}

/** Keywords on Swiss packs (de, fr, it), matched on lower case text without diacritics. */
const KEYWORDS: readonly { pattern: RegExp; kind?: DateKind }[] = [
  {
    pattern: /mindestens\s+haltbar|mind\.?\s*haltbar|(?<![a-z])mhd|haltbar\s+bis/g,
    kind: 'best_before',
  },
  { pattern: /verbrauchen\s+bis|verbrauchsdatum/g, kind: 'use_by' },
  { pattern: /a\s+consommer\s+de\s+preference/g, kind: 'best_before' },
  { pattern: /a\s+consommer\s+jusqu/g, kind: 'use_by' },
  { pattern: /da\s+consumarsi\s+preferibilmente/g, kind: 'best_before' },
  { pattern: /da\s+consumarsi\s+entro/g, kind: 'use_by' },
  { pattern: /best\s+before/g, kind: 'best_before' },
  { pattern: /use\s+by/g, kind: 'use_by' },
  { pattern: /(?<![a-z])exp(?![a-z])/g },
];

/** Characters OCR often swaps for digits; fixed only inside a group of digits and separators. */
const SLIPS: Readonly<Record<string, string>> = {
  O: '0',
  o: '0',
  l: '1',
  I: '1',
  '|': '1',
  S: '5',
  B: '8',
};

const DIGITISH = '[0-9OolI|SB]';
const SEPARATOR = String.raw`\s*[./,-]\s*`;
const NO_WORD_BEFORE = '(?<![A-Za-z0-9|])';
const NO_WORD_AFTER = '(?![A-Za-z0-9|])';
const FULL_DATE = new RegExp(
  `${NO_WORD_BEFORE}(${DIGITISH}{1,2})${SEPARATOR}(${DIGITISH}{1,2})${SEPARATOR}(${DIGITISH}{4}|${DIGITISH}{2})${NO_WORD_AFTER}`,
  'g',
);
// Not the tail or head of a longer chain of groups, e.g. of a full date that was refused.
const MONTH_YEAR = new RegExp(
  `${NO_WORD_BEFORE}(?<![./,-]\\s{0,2})(${DIGITISH}{1,2})\\s*[./-]\\s*(${DIGITISH}{4}|${DIGITISH}{2})${NO_WORD_AFTER}(?!\\s*[./,-]\\s*${DIGITISH})`,
  'g',
);

interface Candidate {
  date: LocalDate;
  /** Only month and year were printed. */
  monthOnly: boolean;
  line: number;
  start: number;
}

const digitsOf = (group: string) =>
  Number(group.replace(/[OolI|SB]/g, (char) => SLIPS[char] ?? char));

const realDigits = (text: string) => (text.match(/[0-9]/g) ?? []).length;

const fullYear = (group: string) => (group.length === 2 ? 2000 : 0) + digitsOf(group);

const pad = (value: number, length: number) => String(value).padStart(length, '0');

/** A real calendar day as `YYYY-MM-DD`, or null (no 31.02.). */
function calendarDay(year: number, month: number, day: number): LocalDate | null {
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return localDate(`${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`);
}

/** Last day of a month: day 0 of the next one. */
function lastDayOf(year: number, month: number): LocalDate | null {
  if (month < 1 || month > 12) {
    return null;
  }
  return calendarDay(year, month, new Date(Date.UTC(year, month, 0)).getUTCDate());
}

/** Lower case without diacritics, char by char so positions stay those of the original. */
const fold = (line: string) =>
  line.replace(/[À-ɏ]/g, (char) => char.normalize('NFD')[0] ?? char).toLowerCase();

function candidatesOf(line: string, index: number): Candidate[] {
  const found: Candidate[] = [];
  const taken: [number, number][] = [];
  for (const match of line.matchAll(FULL_DATE)) {
    const [whole = '', day = '', month = '', year = ''] = match;
    taken.push([match.index, match.index + whole.length]);
    if (realDigits(whole) < 3) {
      continue;
    }
    const date = calendarDay(fullYear(year), digitsOf(month), digitsOf(day));
    if (date !== null) {
      found.push({ date, monthOnly: false, line: index, start: match.index });
    }
  }
  for (const match of line.matchAll(MONTH_YEAR)) {
    const [whole = '', month = '', year = ''] = match;
    const end = match.index + whole.length;
    if (taken.some(([from, to]) => match.index < to && end > from) || realDigits(whole) < 3) {
      continue;
    }
    const date = lastDayOf(fullYear(year), digitsOf(month));
    if (date !== null) {
      found.push({ date, monthOnly: true, line: index, start: match.index });
    }
  }
  return found;
}

interface Keyword {
  start: number;
  end: number;
  kind?: DateKind;
}

function keywordsOf(line: string): Keyword[] {
  const folded = fold(line);
  return KEYWORDS.flatMap(({ pattern, kind }) =>
    [...folded.matchAll(pattern)].map((match) => ({
      start: match.index,
      end: match.index + match[0].length,
      ...(kind === undefined ? {} : { kind }),
    })),
  ).sort((a, b) => a.start - b.start);
}

/**
 * Reads the expiry date from text that was read off a photo of the pack (ADR-0062). A date next
 * to a keyword («Mindestens haltbar bis», «zu verbrauchen bis», …) wins and names the kind;
 * otherwise the earliest date that is today or later: rather too early than too late. Dates in
 * the past are production dates; lot codes and prices are no dates. Month and year alone mean the
 * last day of that month. Null when nothing plausible is there.
 */
export function parseExpiryFromText(text: string, today: LocalDate): ExpiryFromText | null {
  const earliest = addDays(today, -30);
  const latest = addYears(today, 10);
  const lines = text.split(/\r?\n/);
  const raw = lines.map((line, index) => candidatesOf(line, index));
  const perLine = raw.map((group) =>
    group.filter(({ date }) => date >= earliest && date <= latest),
  );
  const keywords = lines.map(keywordsOf);

  const named: { candidate: Candidate; kind?: DateKind }[] = [];
  for (const candidate of perLine.flat()) {
    const here = keywords[candidate.line] ?? [];
    const before = here.filter((keyword) => keyword.end <= candidate.start).at(-1);
    // A keyword that ends the line above, with the date on this one.
    const above =
      (raw[candidate.line - 1]?.length ?? 0) === 0
        ? keywords[candidate.line - 1]?.at(-1)
        : undefined;
    const keyword = before ?? here[0] ?? above;
    if (keyword !== undefined) {
      named.push({ candidate, ...(keyword.kind === undefined ? {} : { kind: keyword.kind }) });
    }
  }
  named.sort((a, b) => a.candidate.date.localeCompare(b.candidate.date));
  const best = named[0];
  if (best !== undefined) {
    return { date: best.candidate.date, ...(best.kind === undefined ? {} : { kind: best.kind }) };
  }

  // Without a keyword: the earliest from today on. Full dates before «mm.yy», which a price like
  // 11.27 can imitate.
  const future = perLine.flat().filter(({ date }) => date >= today);
  for (const monthOnly of [false, true]) {
    const first = future
      .filter((candidate) => candidate.monthOnly === monthOnly)
      .map(({ date }) => date)
      .sort()[0];
    if (first !== undefined) {
      return { date: first };
    }
  }
  return null;
}
