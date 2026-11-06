import { describe, expect, it } from 'vitest';
import { formatQuantity, fractionGlyph } from './quantity-text';

describe('quantity text', () => {
  it('uses fraction glyphs where they exist', () => {
    expect(fractionGlyph(1, 8)).toBe('⅛');
    expect(fractionGlyph(7, 8)).toBe('⅞');
    expect(fractionGlyph(2, 3)).toBe('⅔');
    expect(fractionGlyph(5, 12)).toBe('5/12');
  });

  it('shows pieces as fractions people say, otherwise with a decimal point', () => {
    expect(formatQuantity(0.5, 'pcs')).toBe('½ Stk.');
    expect(formatQuantity(1 / 3, 'pcs')).toBe('⅓ Stk.');
    expect(formatQuantity(0.75, 'pcs')).toBe('¾ Stk.');
    expect(formatQuantity(1.5, 'pcs')).toBe('1½ Stk.');
    expect(formatQuantity(6 / 8, 'pcs')).toBe('¾ Stk.');
    expect(formatQuantity(3 / 8, 'pcs')).toBe('⅜ Stk.');
    expect(formatQuantity(3, 'pcs')).toBe('3 Stk.');
    expect(formatQuantity(0.3, 'pcs')).toBe('0.3 Stk.');
  });

  it('formats amounts in the natural unit with a decimal point', () => {
    expect(formatQuantity(150, 'g')).toBe('150 g');
    expect(formatQuantity(1250, 'g')).toBe('1.25 kg');
    expect(formatQuantity(300, 'ml')).toBe('3 dl');
    expect(formatQuantity(1500, 'ml')).toBe('1.5 l');
  });
});
