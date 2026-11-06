import { describe, expect, it } from 'vitest';
import { isStaleBuildError, mayReloadForUpdate, reloadForUpdate } from './new-version';

const memory = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
};

describe('stale build after an update', () => {
  it('recognises missing chunks in Safari, Chrome and Firefox', () => {
    for (const message of [
      "'text/html' is not a valid JavaScript MIME type for module script 'https://x/assets/ItemDetailPage-DTdieHvc.js'.",
      'Importing a module script failed.',
      'Failed to fetch dynamically imported module: https://x/assets/A.js',
      'error loading dynamically imported module: https://x/assets/A.js',
    ]) {
      expect(isStaleBuildError(new TypeError(message)), message).toBe(true);
    }
    expect(isStaleBuildError(new Error('Item not found'))).toBe(false);
    expect(isStaleBuildError(undefined)).toBe(false);
  });

  it('reloads once, then lets a repeated failure show as an error', () => {
    const store = memory();
    let reloads = 0;
    const reload = () => {
      reloads += 1;
    };
    expect(reloadForUpdate(store, 1_000_000, reload)).toBe(true);
    expect(reloadForUpdate(store, 1_010_000, reload)).toBe(false);
    expect(mayReloadForUpdate(store, 1_040_001)).toBe(true);
    expect(reloads).toBe(1);
  });

  it('never reloads without storage, to rule out loops', () => {
    let reloads = 0;
    expect(
      reloadForUpdate(undefined, 1, () => {
        reloads += 1;
      }),
    ).toBe(false);
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => undefined,
    };
    expect(mayReloadForUpdate(broken, 1)).toBe(false);
    expect(reloads).toBe(0);
  });
});
