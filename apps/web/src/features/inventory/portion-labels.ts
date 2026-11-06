import { displayQuantity, formatDecimal, type PortionChoice, type Unit } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';

const GLYPHS: Record<string, string> = {
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '3/4': '¾',
  '1/5': '⅕',
  '1/6': '⅙',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
};

/** ½, ⅓, ⅛ … where Unicode has a glyph, otherwise «5/12». */
export function fractionGlyph(numerator: number, denominator: number): string {
  const key = `${String(numerator)}/${String(denominator)}`;
  return GLYPHS[key] ?? key;
}

/** Denominators that read well as glyphs for pieces: ½, ⅓, ¼, ⅛ and their multiples. */
const PIECE_DENOMINATORS = [2, 3, 4, 8] as const;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** 0.75 → «¾», 1.5 → «1½», 2 → «2»; null if the fraction is none people would say. */
function piecesAsFraction(quantity: number): string | null {
  const whole = Math.floor(quantity + 1e-6);
  const rest = quantity - whole;
  if (rest < 1e-6) {
    return String(whole);
  }
  for (const denominator of PIECE_DENOMINATORS) {
    const numerator = Math.round(rest * denominator);
    if (numerator > 0 && Math.abs(rest - numerator / denominator) < 1e-6) {
      const divisor = gcd(numerator, denominator);
      const glyph = fractionGlyph(numerator / divisor, denominator / divisor);
      return whole === 0 ? glyph : `${String(whole)}${glyph}`;
    }
  }
  return null;
}

/**
 * «¾ Stk.», «1½ Stk.», «0.3 Stk.», «300 g», «1.25 kg», «3 dl»: in the natural unit with Swiss
 * numbers (ADR-0018); pieces as fractions where people would say them.
 */
export function formatQuantity(quantity: number, unit: Unit): string {
  const shown = displayQuantity(quantity, unit);
  if (shown.unit === 'pcs') {
    return `${piecesAsFraction(quantity) ?? formatDecimal(shown.amount)} ${messages.units.pcs}`;
  }
  return `${formatDecimal(shown.amount)} ${messages.inputUnits[shown.unit]}`;
}

/** Chip text: «½», «¼ · 75 g» for amounts, «2 Stk.», «alles». */
export function portionLabel(choice: PortionChoice, unit: Unit): string {
  switch (choice.kind) {
    case 'fraction': {
      const glyph = fractionGlyph(choice.numerator, choice.denominator);
      return unit === 'pcs' ? glyph : `${glyph} · ${formatQuantity(choice.quantity, unit)}`;
    }
    case 'pieces':
      return formatQuantity(choice.count, 'pcs');
    case 'all':
      return messages.itemDetail.all;
  }
}
