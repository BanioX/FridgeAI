import { FOOTPRINT_ATTRIBUTION } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../app/messages.de-CH';
import { barParts } from './FootprintBars';
import { co2e, food, formatNumber, land, text, water } from './climate-format';

describe('climate numbers (de-CH)', () => {
  it('writes a decimal comma and an apostrophe between thousands', () => {
    expect(formatNumber(1250)).toBe('1’250');
    expect(formatNumber(1234567)).toBe('1’234’567');
    expect(formatNumber(2.4, 1)).toBe('2,4');
    expect(formatNumber(2, 1)).toBe('2');
    expect(formatNumber(0.04, 1)).toBe('0');
  });

  it('shows grams below a kilogram and kilograms with one decimal above', () => {
    expect(text(food(850))).toBe('850 g');
    expect(text(food(2400))).toBe('2,4 kg');
    expect(text(co2e(6100))).toBe('6,1 kg CO₂e');
    expect(text(co2e(850))).toBe('850 g CO₂e');
    expect(text(water(1250))).toBe('1’250 l');
    expect(text(land(3.26))).toBe('3,3 m²');
  });
});

describe('barParts', () => {
  it('splits by share, with a gap, and never loses a small part', () => {
    expect(barParts(0, 0)).toEqual({ rescued: 0, wasted: 0 });
    expect(barParts(5, 0)).toEqual({ rescued: 300, wasted: 0 });
    expect(barParts(0, 5)).toEqual({ rescued: 0, wasted: 300 });
    const half = barParts(1, 1);
    expect(half.rescued).toBe(149);
    expect(half.rescued + half.wasted).toBe(298);
    const tiny = barParts(1, 100000);
    expect(tiny.rescued).toBeGreaterThanOrEqual(4);
    expect(tiny.rescued + tiny.wasted).toBe(298);
  });
});

describe('climate texts', () => {
  it('carries the licence attribution that CC BY 4.0 asks for, as in core', () => {
    expect(messages.climate.attribution).toBe(FOOTPRINT_ATTRIBUTION);
  });

  it('makes no claims of being climate neutral', () => {
    const all = JSON.stringify(messages.climate);
    expect(all).not.toMatch(/klimaneutral|netto.?null|eingespart/i);
  });
});
