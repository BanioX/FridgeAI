import { parseDateInput } from '../dates';
import type { DateKind, LocalDate } from '../model/primitives';

/**
 * Reads the expiry date from the OCR text of a product label (ADR-0006, `expirySource: 'label_ocr'`).
 *
 * Pure text logic, no OCR engine. Swiss labels are often trilingual (DE/FR/IT) and OCR output is
 * noisy, so keywords tolerate missing accents and extra spaces, and date tokens tolerate the usual
 * `O`/`0` and `l`/`I`/`1` confusions.
 */
export interface LabelExpiry {
  expiresOn: LocalDate;
  /** undefined when the label does not say whether it is MHD or use-by */
  kind?: DateKind;
  /** 'keyword': found next to an expiry keyword; 'single_date': the only plausible date on the label */
  confidence: 'keyword' | 'single_date';
}

type KeywordClass = DateKind | 'unknown' | 'ignore';

interface KeywordDef {
  cls: KeywordClass;
  patterns: readonly string[];
}

const APOS = "['’‘´`]?";

const KEYWORD_DEFS: readonly KeywordDef[] = [
  {
    cls: 'use_by',
    patterns: [
      String.raw`zu\s+verbrauchen\s+bis`,
      String.raw`verbrauchen\s+bis`,
      String.raw`verbr\.?\s*bis`,
      String.raw`use[\s-]+by`,
      String.raw`[àa]\s+consommer\s+jusqu${APOS}\s*au`,
      String.raw`da\s+consumare\s+entro`,
    ],
  },
  {
    cls: 'best_before',
    patterns: [
      String.raw`mindestens\s+haltbar\s+bis`,
      String.raw`mind\.?\s*haltbar\s+bis`,
      String.raw`haltbar\s+bis`,
      'mhd',
      String.raw`best\s+before(?:\s+end)?`,
      'bbe',
      String.raw`[àa]\s+consommer\s+de\s+pr[ée]f[ée]rence\s+avant`,
      String.raw`da\s+consumarsi\s+preferibilmente\s+entro`,
    ],
  },
  { cls: 'unknown', patterns: [String.raw`expiry(?:\s+date)?`, String.raw`exp\.?`, 'ablaufdatum'] },
  {
    cls: 'ignore',
    patterns: [
      String.raw`verpackt\s+am`,
      String.raw`abgepackt\s+am`,
      String.raw`hergestellt\s+am`,
      String.raw`produziert\s+am`,
      String.raw`packed\s+on`,
      String.raw`produced\s+on`,
      String.raw`emball[ée]\s+le`,
      String.raw`fabriqu[ée]\s+le`,
      String.raw`confezionato\s+il`,
      String.raw`prodotto\s+il`,
      'lot',
      'charge',
    ],
  },
];

const KEYWORD_REGEXES: readonly { cls: KeywordClass; regex: RegExp }[] = KEYWORD_DEFS.flatMap(
  ({ cls, patterns }) =>
    patterns.map((pattern) => ({
      cls,
      regex: new RegExp(String.raw`(?<![\p{L}\d])(?:${pattern})(?![\p{L}\d])`, 'giu'),
    })),
);

/** A digit or a letter OCR commonly mistakes for one. */
const D = '[0-9OolI|]';
const DATE_REGEX = new RegExp(
  [
    String.raw`(?<![\dA-Za-z|])(?:`,
    [
      `${D}{4}-${D}{2}-${D}{2}`, // yyyy-mm-dd
      `${D}{1,2}[./-]${D}{1,2}[./-](?:${D}{4}|${D}{2})`, // dd.mm.yyyy, dd/mm/yy, d.m.yy, dd-mm-yyyy
      `${D}{1,2} ${D}{1,2} (?:${D}{4}|${D}{2})`, // dd mm yy
      `${D}{1,2}[./-]${D}{4}`, // mm.yyyy
      `${D}{2}/${D}{2}`, // mm/yy
    ].join('|'),
    String.raw`)(?![\dA-Za-z|]|\.\d)`,
  ].join(''),
  'g',
);

const PRIORITY: Record<Exclude<KeywordClass, 'ignore'>, number> = {
  use_by: 3,
  best_before: 2,
  unknown: 1,
};

interface DateCandidate {
  start: number;
  date: LocalDate;
}

interface Keyword {
  start: number;
  end: number;
  cls: KeywordClass;
}

function parseCandidate(token: string, today: LocalDate): LocalDate | null {
  // Every number needs at least one real digit, so words like «Il» never pass as dates.
  if (token.split(/[^0-9OolI|]+/).some((part) => !/\d/.test(part))) {
    return null;
  }
  const fixed = token.replace(/[Oo]/g, '0').replace(/[lI|]/g, '1');
  const monthYear = /^(\d{2})\/(\d{2})$/.exec(fixed);
  return parseDateInput(monthYear ? `${monthYear[1]}.20${monthYear[2]}` : fixed, today);
}

function findCandidates(text: string, today: LocalDate): DateCandidate[] {
  const found: DateCandidate[] = [];
  for (const match of text.matchAll(DATE_REGEX)) {
    const date = parseCandidate(match[0], today);
    if (date !== null) {
      found.push({ start: match.index, date });
    }
  }
  return found;
}

/** All keyword matches, non-overlapping; at the same position the longer keyword wins. */
function findKeywords(text: string): Keyword[] {
  const all: Keyword[] = [];
  for (const { cls, regex } of KEYWORD_REGEXES) {
    for (const match of text.matchAll(regex)) {
      all.push({ start: match.index, end: match.index + match[0].length, cls });
    }
  }
  all.sort((a, b) => a.start - b.start || b.end - a.end);
  const accepted: Keyword[] = [];
  let lastEnd = 0;
  for (const keyword of all) {
    if (keyword.start >= lastEnd) {
      accepted.push(keyword);
      lastEnd = keyword.end;
    }
  }
  return accepted;
}

/**
 * Reads the expiry date from label text.
 *
 * 1. Date candidates are found (OCR-tolerant) and parsed with `parseDateInput`; the rest is dropped.
 * 2. Every keyword points to the first candidate after it on the same line or the next line (or
 *    further down if only keywords/punctuation lie in between, as in trilingual blocks). If a
 *    «packed on»/«lot» keyword is the closest one in front of a date, that date is not an expiry.
 * 3. Among dates pointed to by expiry keywords, use_by beats best_before beats unknown; on equal
 *    rank the earliest date wins (safer).
 * 4. Without keyword hit, the only remaining candidate counts as `single_date`; otherwise null.
 */
export function extractExpiryFromLabel(text: string, today: LocalDate): LabelExpiry | null {
  const base = text.normalize('NFC').replace(/\r\n?/g, '\n');
  const candidates = findCandidates(base, today);
  if (candidates.length === 0) {
    return null;
  }
  const keywords = findKeywords(base);

  const lineStarts = [0];
  for (let i = base.indexOf('\n'); i !== -1; i = base.indexOf('\n', i + 1)) {
    lineStarts.push(i + 1);
  }
  const lineOf = (position: number): number => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if ((lineStarts[mid] ?? 0) <= position) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    return low;
  };

  // Text with keywords blanked out, to tell «only keywords in between» from real content.
  let masked = '';
  let cursor = 0;
  for (const keyword of keywords) {
    masked += base.slice(cursor, keyword.start) + ' '.repeat(keyword.end - keyword.start);
    cursor = keyword.end;
  }
  masked += base.slice(cursor);
  const lineIsBlank = (line: number): boolean => {
    const start = lineStarts[line] ?? 0;
    const end = (lineStarts[line + 1] ?? base.length + 1) - 1;
    return /^[\s/:;.,|\-–—]*$/.test(masked.slice(start, end));
  };

  // Which keywords point to which candidate (ascending by keyword position).
  const pointers = new Map<number, Keyword[]>();
  let next = 0;
  for (const keyword of keywords) {
    while (candidates[next] !== undefined && (candidates[next]?.start ?? 0) < keyword.end) {
      next += 1;
    }
    const candidate = candidates[next];
    if (candidate === undefined) {
      break;
    }
    const keywordLine = lineOf(keyword.end);
    const dateLine = lineOf(candidate.start);
    let reachable = true;
    for (let line = keywordLine + 1; line < dateLine; line += 1) {
      reachable = reachable && lineIsBlank(line);
    }
    if (reachable) {
      pointers.set(next, [...(pointers.get(next) ?? []), keyword]);
    }
  }

  const excluded = new Set<number>();
  let best: { priority: number; date: LocalDate } | null = null;
  for (const [index, pointing] of pointers) {
    const candidate = candidates[index];
    const nearest = pointing[pointing.length - 1];
    if (candidate === undefined || nearest === undefined) {
      continue;
    }
    if (nearest.cls === 'ignore') {
      excluded.add(index);
      continue;
    }
    for (const keyword of pointing) {
      if (keyword.cls !== 'ignore') {
        const priority = PRIORITY[keyword.cls];
        if (
          best === null ||
          priority > best.priority ||
          (priority === best.priority && candidate.date < best.date)
        ) {
          best = { priority, date: candidate.date };
        }
      }
    }
  }

  if (best !== null) {
    if (best.priority === PRIORITY.use_by) {
      return { expiresOn: best.date, kind: 'use_by', confidence: 'keyword' };
    }
    if (best.priority === PRIORITY.best_before) {
      return { expiresOn: best.date, kind: 'best_before', confidence: 'keyword' };
    }
    return { expiresOn: best.date, confidence: 'keyword' };
  }

  const remaining = new Set(
    candidates.filter((_, index) => !excluded.has(index)).map((candidate) => candidate.date),
  );
  const [only] = remaining;
  return remaining.size === 1 && only !== undefined
    ? { expiresOn: only, confidence: 'single_date' }
    : null;
}
