import {
  DEFAULT_CURRENCY,
  HouseholdSchema,
  MemberSchema,
  ReminderPrefsSchema,
  type Clock,
  type Household,
  type Id,
  type IdGenerator,
  type IsoDateTime,
  type Member,
  type ReminderPrefs,
} from '@fridgeai/core';
import type { FridgeDb } from './db';

export interface LocalProfile {
  household: Household;
  member: Member;
}

/**
 * Without an account, rettich quietly creates a local household with one member on first start
 * (US-15, ADR-0003). Safe to call on every start: it returns the existing profile if there is one.
 */
export async function ensureLocalHousehold(
  db: FridgeDb,
  clock: Clock,
  ids: IdGenerator,
  names: { household: string; member: string },
): Promise<LocalProfile> {
  return db.transaction('rw', [db.households, db.members, db.reminderPrefs, db.meta], async () => {
    const householdId = (await db.meta.get('currentHouseholdId'))?.value;
    const memberId = (await db.meta.get('currentMemberId'))?.value;
    if (householdId !== undefined && memberId !== undefined) {
      const household = await db.households.get(householdId as Household['id']);
      const member = await db.members.get(memberId as Member['id']);
      if (household !== undefined && member !== undefined) {
        return { household, member };
      }
    }

    const now = clock.now();
    const household = HouseholdSchema.parse({
      id: ids.next(),
      name: names.household,
      plan: 'free',
      currency: DEFAULT_CURRENCY,
      createdAt: now,
      updatedAt: now,
    });
    const member = MemberSchema.parse({
      id: ids.next(),
      householdId: household.id,
      displayName: names.member,
      role: 'owner',
      joinedAt: now,
      updatedAt: now,
    });
    await db.households.add(household);
    await db.members.add(member);
    await db.reminderPrefs.add(defaultReminderPrefs(ids.next(), member, now));
    await db.meta.bulkPut([
      { key: 'currentHouseholdId', value: household.id },
      { key: 'currentMemberId', value: member.id },
    ]);
    return { household, member };
  });
}

/** Reminders as a new member starts with them: digest at 17:30, in the app only. */
export function defaultReminderPrefs(id: Id, member: Member, now: IsoDateTime): ReminderPrefs {
  return ReminderPrefsSchema.parse({
    id,
    householdId: member.householdId,
    memberId: member.id,
    digestTime: '17:30',
    daysBefore: [3, 1],
    quietHours: { start: '22:00', end: '07:00' },
    channels: { push: false, inApp: true },
    updatedAt: now,
  });
}
