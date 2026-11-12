import { describe, expect, it } from 'vitest';
import { problemWith, processPrefillFrom, resultFor } from './process-state';

const id = '019a5a3b-6c00-7000-8000-000000000001';

describe('processPrefillFrom', () => {
  it('reads what the recipe page passed and drops anything that is not an id', () => {
    expect(
      processPrefillFrom({
        process: { recipeId: 'risotto', title: 'Risotto', itemIds: [id, 'x', 4] },
      }),
    ).toEqual({ recipeId: 'risotto', title: 'Risotto', itemIds: [id] });
  });

  it('ignores other state', () => {
    for (const state of [null, {}, { process: null }, { process: { recipeId: '', title: 'x' } }]) {
      expect(processPrefillFrom(state)).toBeNull();
    }
  });
});

describe('problemWith', () => {
  it('needs a name for a result and ingredients unless it is a leftover from nothing', () => {
    expect(problemWith('made', '  ', 2)).toBe('name');
    expect(problemWith('made', 'Kuchen', 0)).toBe('ingredients');
    expect(problemWith('made', 'Kuchen', 1)).toBeNull();
    expect(problemWith('leftover', 'Reste: Lasagne', 0)).toBeNull();
    expect(problemWith('none', '', 0)).toBe('ingredients');
    expect(problemWith('none', '', 3)).toBeNull();
  });
});

describe('resultFor', () => {
  it('has no result for «nichts übrig» and a trimmed name otherwise', () => {
    expect(resultFor('none', 'x')).toBeUndefined();
    expect(resultFor('leftover', ' Reste ')).toEqual({ name: 'Reste', kind: 'leftover' });
  });
});
