import { localDate, type StorageLocation } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { expiryBadge } from './expiry-badge';

const today = localDate('2026-11-06');
const d = localDate;

describe('expiryBadge', () => {
  it.each([
    [
      { kind: 'past_use_by', daysOver: 1 } as const,
      '2026-11-05',
      'fridge',
      'danger',
      'Nicht mehr essen',
    ],
    [
      { kind: 'past_best_before', daysOver: 3 } as const,
      '2026-11-03',
      'fridge',
      'today',
      'seit 3 Tagen',
    ],
    [
      { kind: 'past_best_before', daysOver: 1 } as const,
      '2026-11-05',
      'pantry',
      'today',
      'seit gestern',
    ],
    [{ kind: 'today' } as const, '2026-11-06', 'fridge', 'today', 'heute'],
    [{ kind: 'soon', daysLeft: 1 } as const, '2026-11-07', 'fridge', 'soon', 'morgen'],
    [{ kind: 'soon', daysLeft: 3 } as const, '2026-11-09', 'fridge', 'soon', 'in 3 Tagen'],
    [{ kind: 'fresh', daysLeft: 5 } as const, '2026-11-11', 'fridge', 'fresh', 'in 5 Tagen'],
    [
      { kind: 'fresh', daysLeft: 400 } as const,
      '2027-12-11',
      'pantry',
      'wheat',
      'bis Dezember 2027',
    ],
    [{ kind: 'fresh', daysLeft: 50 } as const, '2026-12-26', 'freezer', 'ice', 'bis Dezember'],
    [{ kind: 'fresh', daysLeft: 120 } as const, '2027-03-06', 'freezer', 'ice', 'bis März 2027'],
    [{ kind: 'fresh', daysLeft: 9000 } as const, '2051-06-01', 'reserve', 'olive', 'bis 2051'],
  ])('%o on %s in %s → %s «%s»', (status, expiresOn, location, tone, label) => {
    expect(expiryBadge(status, d(expiresOn), today, location as StorageLocation)).toEqual({
      tone,
      label,
    });
  });
});
