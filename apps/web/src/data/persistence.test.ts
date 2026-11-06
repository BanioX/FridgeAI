import { describe, expect, it } from 'vitest';
import { requestPersistentStorage } from './persistence';

const storage = (persisted: boolean, granted: boolean | Error) => {
  const calls: string[] = [];
  return {
    calls,
    manager: {
      persisted: () => {
        calls.push('persisted');
        return Promise.resolve(persisted);
      },
      persist: () => {
        calls.push('persist');
        return granted instanceof Error ? Promise.reject(granted) : Promise.resolve(granted);
      },
    },
  };
};

describe('requestPersistentStorage', () => {
  it('asks only when the data is not kept for good yet', async () => {
    const kept = storage(true, false);
    expect(await requestPersistentStorage(kept.manager)).toBe(true);
    expect(kept.calls).toEqual(['persisted']);

    const asked = storage(false, true);
    expect(await requestPersistentStorage(asked.manager)).toBe(true);
    expect(asked.calls).toEqual(['persisted', 'persist']);
  });

  it('never fails: refused, broken or missing storage API', async () => {
    expect(await requestPersistentStorage(storage(false, false).manager)).toBe(false);
    expect(await requestPersistentStorage(storage(false, new Error('nope')).manager)).toBe(false);
    expect(await requestPersistentStorage(undefined)).toBe(false);
  });
});
