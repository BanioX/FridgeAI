import type { PortionChoice, Unit } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';
import { formatQuantity, fractionGlyph } from '../../ui/quantity-text';

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
