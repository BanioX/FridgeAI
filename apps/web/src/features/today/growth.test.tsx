import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { growthOf, leafAngles, MAX_LEAVES } from './growth';
import { RettichGrowth } from './RettichGrowth';

describe('growthOf (ADR-0043)', () => {
  it('grows one leaf per rescue and moves up a stage at 1, 3, 6 and 10', () => {
    expect(growthOf(0)).toEqual({
      stage: 'seed',
      leaves: 0,
      next: { stage: 'sprout', missing: 1 },
    });
    expect(growthOf(1)).toEqual({
      stage: 'sprout',
      leaves: 1,
      next: { stage: 'young', missing: 2 },
    });
    expect(growthOf(5).stage).toBe('young');
    expect(growthOf(6)).toEqual({
      stage: 'grown',
      leaves: 6,
      next: { stage: 'model', missing: 4 },
    });
    expect(growthOf(10)).toEqual({ stage: 'model', leaves: MAX_LEAVES, next: null });
    expect(growthOf(250).leaves).toBe(MAX_LEAVES);
    expect(growthOf(-3).stage).toBe('seed');
  });

  it('fans the leaves out symmetrically, never wider than 66 degrees', () => {
    expect(leafAngles(0)).toEqual([]);
    expect(leafAngles(1)).toEqual([0]);
    expect(leafAngles(3)).toEqual([-30, 0, 30]);
    const seven = leafAngles(MAX_LEAVES);
    expect(seven).toHaveLength(MAX_LEAVES);
    expect(Math.min(...seven)).toBe(-66);
    expect(Math.max(...seven)).toBe(66);
  });
});

describe('RettichGrowth', () => {
  afterEach(cleanup);

  it('names the stage, the leaves and what is missing for the next stage', () => {
    render(<RettichGrowth rescues={2} />);
    expect(screen.getByRole('img', { name: 'Dein Rettich: Keimling, 2 Blätter' })).toBeDefined();
    expect(screen.getByText('2 Rettungen diesen Monat · noch 1 bis Jungpflanze')).toBeDefined();
  });

  it('becomes «Vorbild» on an onyx tile at the milestone', () => {
    render(<RettichGrowth rescues={12} />);
    const picture = screen.getByRole('img', { name: 'Dein Rettich: Vorbild, 7 Blätter' });
    expect(picture.querySelector('rect')?.getAttribute('class')).toContain('fill-onyx');
    expect(screen.getByText('12 Rettungen diesen Monat')).toBeDefined();
  });
});
