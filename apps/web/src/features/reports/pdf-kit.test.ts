import { describe, expect, it } from 'vitest';
import { niceTicks } from './pdf-kit';

describe('niceTicks', () => {
  it('rounds the axis to steps of 1, 2, 2.5 or 5 times a power of ten', () => {
    expect(niceTicks(1210, 3)).toEqual([0, 500, 1000, 1500]);
    expect(niceTicks(90, 3)).toEqual([0, 50, 100]);
    expect(niceTicks(7, 3)).toEqual([0, 2.5, 5, 7.5]);
    expect(niceTicks(300, 3)).toEqual([0, 100, 200, 300]);
  });

  it('keeps an axis for an empty chart', () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});
