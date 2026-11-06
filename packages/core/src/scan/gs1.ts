import {
  isValidGtin,
  LocalDateSchema,
  type DateKind,
  type Gtin,
  type LocalDate,
} from '../model/primitives';

/**
 * Reads what a scanned code says about a product (ADR-0006).
 *
 * - Classic EAN/UPC barcodes only carry the GTIN (article number).
 * - GS1 2D codes (GS1 DataMatrix, GS1 QR with Digital Link URIs) can also carry the expiry date,
 *   batch and weight. Retail is moving to them («GS1 Sunrise 2027»); FridgeAI reads them already.
 */
export interface Gs1Data {
  gtin?: Gtin;
  batch?: string;
  serial?: string;
  productionDate?: LocalDate;
  packagingDate?: LocalDate;
  /** AI 15: best before (MHD). */
  bestBefore?: LocalDate;
  /** AI 16: sell by – not an expiry date for the household. */
  sellBy?: LocalDate;
  /** AI 17: expiration / use by. */
  useBy?: LocalDate;
  netWeightGrams?: number;
  netVolumeMl?: number;
}

export type ScannedCodeFormat = 'gtin' | 'gs1_element_string' | 'gs1_digital_link';

export interface ScannedCode {
  format: ScannedCodeFormat;
  data: Gs1Data;
}

const GROUP_SEPARATOR = '\u001d';
const SYMBOLOGY_PREFIX = /^\][A-Za-z]\d/; // e.g. ]d2 (DataMatrix), ]Q3 (QR), ]C1 (GS1-128)

/** Length rules of the application identifiers (AIs) FridgeAI understands, by their first digits. */
interface AiRule {
  aiLength: number;
  /** Fixed data length, or undefined for variable length (terminated by GS or end). */
  fixed?: number;
  max: number;
}

const AI_RULES: Record<string, AiRule> = {
  '00': { aiLength: 2, fixed: 18, max: 18 },
  '01': { aiLength: 2, fixed: 14, max: 14 },
  '02': { aiLength: 2, fixed: 14, max: 14 },
  '10': { aiLength: 2, max: 20 },
  '11': { aiLength: 2, fixed: 6, max: 6 },
  '12': { aiLength: 2, fixed: 6, max: 6 },
  '13': { aiLength: 2, fixed: 6, max: 6 },
  '15': { aiLength: 2, fixed: 6, max: 6 },
  '16': { aiLength: 2, fixed: 6, max: 6 },
  '17': { aiLength: 2, fixed: 6, max: 6 },
  '20': { aiLength: 2, fixed: 2, max: 2 },
  '21': { aiLength: 2, max: 20 },
  '22': { aiLength: 2, max: 20 },
  '30': { aiLength: 2, max: 8 },
  '31': { aiLength: 4, fixed: 6, max: 6 },
  '32': { aiLength: 4, fixed: 6, max: 6 },
  '33': { aiLength: 4, fixed: 6, max: 6 },
  '34': { aiLength: 4, fixed: 6, max: 6 },
  '35': { aiLength: 4, fixed: 6, max: 6 },
  '36': { aiLength: 4, fixed: 6, max: 6 },
  '37': { aiLength: 2, max: 8 },
  '39': { aiLength: 4, max: 15 },
  '41': { aiLength: 3, fixed: 13, max: 13 },
  '90': { aiLength: 2, max: 30 },
  '91': { aiLength: 2, max: 90 },
  '92': { aiLength: 2, max: 90 },
  '93': { aiLength: 2, max: 90 },
  '94': { aiLength: 2, max: 90 },
  '95': { aiLength: 2, max: 90 },
  '96': { aiLength: 2, max: 90 },
  '97': { aiLength: 2, max: 90 },
  '98': { aiLength: 2, max: 90 },
  '99': { aiLength: 2, max: 90 },
};

/** Digital Link path keys may use these short names instead of the numeric AI. */
const DIGITAL_LINK_ALIASES: Record<string, string> = {
  gtin: '01',
  lot: '10',
  ser: '21',
  cpv: '22',
};

/**
 * GS1 date YYMMDD with the GS1 century rule (sliding window around `today`); DD = 00 means the
 * last day of the month.
 */
export function parseGs1Date(value: string, today: LocalDate): LocalDate | null {
  const match = /^(\d{2})(\d{2})(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const yy = Number(match[1]);
  const month = Number(match[2]);
  let day = Number(match[3]);
  const currentYear = Number(today.slice(0, 4));
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const difference = yy - (currentYear % 100);
  let century = currentCentury;
  if (difference >= 51) {
    century -= 100;
  } else if (difference <= -50) {
    century += 100;
  }
  const year = century + yy;
  if (month < 1 || month > 12) {
    return null;
  }
  if (day === 0) {
    day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  }
  const parsed = LocalDateSchema.safeParse(
    `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  );
  return parsed.success ? parsed.data : null;
}

/** GTIN-14 with a leading zero becomes the GTIN-13 (EAN) that product databases use. */
function normalizeGtin(digits: string): Gtin | undefined {
  if (!isValidGtin(digits)) {
    return undefined;
  }
  const normalized = digits.length === 14 && digits.startsWith('0') ? digits.slice(1) : digits;
  return normalized as Gtin;
}

function applyAi(data: Gs1Data, ai: string, value: string, today: LocalDate): void {
  switch (ai) {
    case '01':
    case '02': {
      const gtin = normalizeGtin(value);
      if (gtin !== undefined) {
        data.gtin = gtin;
      }
      return;
    }
    case '10':
      data.batch = value;
      return;
    case '21':
      data.serial = value;
      return;
    case '11':
    case '13':
    case '15':
    case '16':
    case '17': {
      const date = parseGs1Date(value, today);
      if (date === null) {
        return;
      }
      const field = {
        '11': 'productionDate',
        '13': 'packagingDate',
        '15': 'bestBefore',
        '16': 'sellBy',
        '17': 'useBy',
      } as const;
      data[field[ai]] = date;
      return;
    }
    default:
      break;
  }
  // 310n: net weight in kg with n decimals; 315n: net volume in litres with n decimals.
  const measure = /^31([05])(\d)$/.exec(ai);
  if (measure && /^\d{6}$/.test(value)) {
    const amount = (Number(value) / 10 ** Number(measure[2])) * 1000;
    if (measure[1] === '0') {
      data.netWeightGrams = Math.round(amount);
    } else {
      data.netVolumeMl = Math.round(amount);
    }
  }
}

/** Parses a GS1 element string (with GS separators) into AI/value pairs. */
function parseElementString(input: string, today: LocalDate): Gs1Data | null {
  const data: Gs1Data = {};
  let rest = input;
  while (rest.length > 0) {
    if (rest.startsWith(GROUP_SEPARATOR)) {
      rest = rest.slice(1);
      continue;
    }
    const rule = AI_RULES[rest.slice(0, 2)];
    if (rule === undefined || rest.length <= rule.aiLength) {
      break; // unknown AI: keep what was read so far
    }
    const ai = rest.slice(0, rule.aiLength);
    rest = rest.slice(rule.aiLength);
    let value: string;
    if (rule.fixed === undefined) {
      const end = rest.indexOf(GROUP_SEPARATOR);
      value = (end === -1 ? rest : rest.slice(0, end)).slice(0, rule.max);
      rest = rest.slice(value.length);
    } else {
      if (rest.length < rule.fixed) {
        break; // truncated code
      }
      value = rest.slice(0, rule.fixed);
      rest = rest.slice(rule.fixed);
    }
    applyAi(data, ai, value, today);
  }
  return Object.keys(data).length > 0 ? data : null;
}

/** «(01)09506000134352(17)261231(10)ABC» → element string with GS separators. */
function fromHumanReadable(input: string): string | null {
  const pairs = [...input.matchAll(/\((\d{2,4})\)([^(]*)/g)];
  if (pairs.length === 0 || pairs.map((pair) => pair[0]).join('') !== input) {
    return null;
  }
  return pairs.map((pair) => `${pair[1] ?? ''}${pair[2] ?? ''}`).join(GROUP_SEPARATOR);
}

function parseDigitalLink(input: string, today: LocalDate): Gs1Data | null {
  const match = /^https?:\/\/[^/?#]+(\/[^?#]*)(?:\?([^#]*))?/i.exec(input);
  if (!match) {
    return null;
  }
  const segments = (match[1] ?? '').split('/').filter((segment) => segment !== '');
  const start = segments.findIndex((segment) => segment === '01' || segment === 'gtin');
  if (start === -1) {
    return null;
  }
  const data: Gs1Data = {};
  for (let i = start; i + 1 < segments.length; i += 2) {
    const key = segments[i] ?? '';
    const ai = DIGITAL_LINK_ALIASES[key] ?? key;
    applyAi(data, ai, decodeURIComponent(segments[i + 1] ?? ''), today);
  }
  for (const pair of (match[2] ?? '').split('&')) {
    const [key = '', value = ''] = pair.split('=');
    if (/^\d{2,4}$/.test(key)) {
      applyAi(data, key, decodeURIComponent(value), today);
    }
  }
  return data.gtin === undefined ? null : data;
}

/**
 * Interprets the raw text of any scanned code: plain EAN/UPC/GTIN, GS1 element string (raw with
 * GS separators, with symbology prefix, or human-readable with parentheses) or GS1 Digital Link.
 */
export function parseScannedCode(raw: string, today: LocalDate): ScannedCode | null {
  const input = raw.trim();
  if (input === '') {
    return null;
  }

  if (/^\d{8}$|^\d{12,14}$/.test(input)) {
    const gtin = normalizeGtin(input);
    return gtin === undefined ? null : { format: 'gtin', data: { gtin } };
  }

  if (/^https?:\/\//i.test(input)) {
    const data = parseDigitalLink(input, today);
    return data === null ? null : { format: 'gs1_digital_link', data };
  }

  const elementString = input.startsWith('(')
    ? fromHumanReadable(input)
    : input.replace(SYMBOLOGY_PREFIX, '');
  if (elementString === null) {
    return null;
  }
  const data = parseElementString(elementString, today);
  return data === null ? null : { format: 'gs1_element_string', data };
}

/**
 * The expiry date a scanned code provides, if any. Use-by (AI 17) wins over best-before (AI 15)
 * because it is the safety-relevant date. Sell-by (AI 16) is ignored.
 */
export function expiryFromScan(data: Gs1Data): { expiresOn: LocalDate; kind: DateKind } | null {
  if (data.useBy !== undefined) {
    return { expiresOn: data.useBy, kind: 'use_by' };
  }
  if (data.bestBefore !== undefined) {
    return { expiresOn: data.bestBefore, kind: 'best_before' };
  }
  return null;
}
