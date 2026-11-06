import { describe, expect, it } from 'vitest';
import { formatDecimal, groupThousands } from '../src/format';

describe('formatDecimal', () => {
  it('uses a decimal point and drops trailing zeros', () => {
    expect(formatDecimal(1.5)).toBe('1.5');
    expect(formatDecimal(0.25)).toBe('0.25');
    expect(formatDecimal(2)).toBe('2');
    expect(formatDecimal(1.1 + 2.2)).toBe('3.3');
  });

  it('rounds to the given number of decimals', () => {
    expect(formatDecimal(1 / 3)).toBe('0.33');
    expect(formatDecimal(2 / 3, { digits: 1 })).toBe('0.7');
    expect(formatDecimal(0.999)).toBe('1');
    expect(formatDecimal(1.2345, { digits: 3 })).toBe('1.235');
  });

  it('groups thousands with ’ unless asked not to', () => {
    expect(formatDecimal(1250)).toBe('1’250');
    expect(formatDecimal(1234567.5)).toBe('1’234’567.5');
    expect(formatDecimal(1250, { group: false })).toBe('1250');
  });

  it('keeps the sign, but not for values that round to zero', () => {
    expect(formatDecimal(-1.5)).toBe('-1.5');
    expect(formatDecimal(-0.001)).toBe('0');
  });
});

describe('groupThousands', () => {
  it('groups digit strings', () => {
    expect(groupThousands('999')).toBe('999');
    expect(groupThousands('1000')).toBe('1’000');
  });
});
