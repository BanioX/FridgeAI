import { portionChoices } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { portionLabel } from './portion-labels';

describe('portion labels', () => {
  it('labels a cake by fractions of one piece, cheese with the amount', () => {
    expect(portionChoices(1, 'pcs', [8, 4]).map((c) => portionLabel(c, 'pcs'))).toEqual([
      '⅛',
      '¼',
      '½',
      '¾',
      'alles',
    ]);
    expect(portionChoices(300, 'g', [3]).map((c) => portionLabel(c, 'g'))).toEqual([
      '⅓ · 100 g',
      '⅔ · 200 g',
      'alles',
    ]);
    expect(portionChoices(3, 'pcs', []).map((c) => portionLabel(c, 'pcs'))).toEqual([
      '1 Stk.',
      '2 Stk.',
      'alles',
    ]);
  });
});
