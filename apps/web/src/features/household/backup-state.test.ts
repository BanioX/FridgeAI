import { localDate } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import {
  backupDayOfImport,
  backupDue,
  clearLastBackup,
  readLastBackup,
  writeLastBackup,
} from './backup-state';

const today = localDate('2026-11-12');

describe('backupDue', () => {
  it('stays quiet while there is little to lose', () => {
    expect(backupDue(null, today, 9, localDate('2026-09-01'))).toBe(false);
  });

  it('waits two weeks of use before the first reminder', () => {
    expect(backupDue(null, today, 12, localDate('2026-11-01'))).toBe(false);
    expect(backupDue(null, today, 12, localDate('2026-10-29'))).toBe(true);
    expect(backupDue(null, today, 12, null)).toBe(false);
  });

  it('reminds once the last export is a month old', () => {
    expect(backupDue(localDate('2026-10-20'), today, 12, null)).toBe(false);
    expect(backupDue(localDate('2026-10-13'), today, 12, null)).toBe(true);
  });
});

describe('the last backup on this device', () => {
  it('is written and read back as a day, and survives blocked storage', () => {
    const values = new Map<string, string>();
    const store = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    expect(readLastBackup(store)).toBeNull();
    writeLastBackup(today, store);
    expect(readLastBackup(store)).toBe('2026-11-12');

    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readLastBackup(blocked)).toBeNull();
    expect(() => {
      writeLastBackup(today, blocked);
    }).not.toThrow();
  });
});

describe('the backup date around import and delete', () => {
  const memory = () => {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
  };

  it('takes the export day of the file (Swiss time), else today', () => {
    expect(backupDayOfImport('2026-11-01T23:30:00.000Z', today)).toBe('2026-11-02');
    expect(backupDayOfImport(undefined, today)).toBe(today);
    expect(backupDayOfImport('garbage', today)).toBe(today);
  });

  it('forgets the date after a full delete, even with blocked storage', () => {
    const store = memory();
    writeLastBackup(today, store);
    clearLastBackup(store);
    expect(readLastBackup(store)).toBeNull();
    const blocked = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(() => {
      clearLastBackup(blocked);
    }).not.toThrow();
  });
});
