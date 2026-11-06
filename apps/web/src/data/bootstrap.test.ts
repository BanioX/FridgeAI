import 'fake-indexeddb/auto';
import { HouseholdSchema, MemberSchema, ReminderPrefsSchema } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { ensureLocalHousehold } from './bootstrap';
import { browserClock, browserIds } from './adapters';
import { fixedClock, sequentialIds, testDb } from './test-helpers';

const names = { household: 'Mein Haushalt', member: 'Ich' };

describe('ensureLocalHousehold', () => {
  it('creates a local household, an owner and default reminders on first start', async () => {
    const db = testDb();
    const profile = await ensureLocalHousehold(db, fixedClock(), sequentialIds(), names);
    expect(HouseholdSchema.parse(profile.household).name).toBe('Mein Haushalt');
    expect(MemberSchema.parse(profile.member)).toMatchObject({ role: 'owner', displayName: 'Ich' });
    const prefs = await db.reminderPrefs.where('memberId').equals(profile.member.id).toArray();
    expect(prefs).toHaveLength(1);
    expect(ReminderPrefsSchema.parse(prefs[0])).toMatchObject({
      digestTime: '17:30',
      daysBefore: [3, 1],
    });
  });

  it('returns the same profile on every later start', async () => {
    const db = testDb();
    const first = await ensureLocalHousehold(db, fixedClock(), sequentialIds(), names);
    const second = await ensureLocalHousehold(db, fixedClock(), sequentialIds(), names);
    expect(second.household.id).toBe(first.household.id);
    expect(await db.households.count()).toBe(1);
    expect(await db.members.count()).toBe(1);
  });

  it('works with the real browser clock and secure IDs', async () => {
    const db = testDb();
    const profile = await ensureLocalHousehold(db, browserClock, browserIds, names);
    expect(profile.household.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(browserClock.today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
