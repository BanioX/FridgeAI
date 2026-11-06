import type { PortionChoice, Unit } from '@fridgeai/core';
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
};

/** ½, ⅓, ⅛ … where Unicode has a glyph, otherwise «5/12». */
export function fractionGlyph(numerator: number, denominator: number): string {
  const key = `${String(numerator)}/${String(denominator)}`;
  return GLYPHS[key] ?? key;
}

/** «2 Stk.», «300 g» – quantities in the item's base unit, with a decimal comma. */
export function formatQuantity(quantity: number, unit: Unit): string {
  const rounded = Math.round(quantity * 100) / 100;
  return `${String(rounded).replace('.', ',')} ${messages.units[unit]}`;
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
