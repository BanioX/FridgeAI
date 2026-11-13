import { beforeEach, describe, expect, it } from 'vitest';
import {
  createFeedbackUseCases,
  createHouseholdUseCases,
  createMemoryStorage,
  HouseholdSchema,
  IsoDateTimeSchema,
  localDate,
  shouldAskFeedback,
  uuidV7,
  type Id,
  type Storage,
} from '../src';

/** The one question after a week (ADR-0089) on memory storage. */
let storage: Storage;
let feedback: ReturnType<typeof createFeedbackUseCases>;
let household: ReturnType<typeof createHouseholdUseCases>;
let clockNow = '2026-11-13T09:00:00.000Z';
const householdId = id(1);

function id(counter: number): Id {
  const random = new Uint8Array(10);
  random[9] = counter;
  return uuidV7(1_762_500_000_000 + counter, random);
}

beforeEach(async () => {
  let counter = 10;
  storage = createMemoryStorage();
  const ctx = {
    storage,
    clock: {
      now: () => IsoDateTimeSchema.parse(clockNow),
      today: () => localDate(clockNow.slice(0, 10)),
    },
    ids: { next: () => id((counter += 1)) },
    actor: id(2),
  };
  feedback = createFeedbackUseCases(ctx);
  household = createHouseholdUseCases(ctx);
  await storage.households.add(
    HouseholdSchema.parse({
      id: householdId,
      name: 'WG',
      plan: 'free',
      createdAt: '2026-11-02T08:00:00.000Z',
      updatedAt: '2026-11-02T08:00:00.000Z',
    }),
  );
});

describe('feedback use cases', () => {
  it('saves answers, lists them newest first, and knows the first day of use', async () => {
    await feedback['feedback.save']({ commandId: id(90), householdId, text: 'Zu viele Klicks' });
    clockNow = '2026-11-14T09:00:00.000Z';
    await feedback['feedback.save']({ commandId: id(91), householdId, text: '  Datum fehlt  ' });
    const listed = await feedback['feedback.list']({ householdId });
    expect(listed.firstUseOn).toBe('2026-11-02');
    expect(listed.answers.map((answer) => answer.text)).toEqual(['Datum fehlt', 'Zu viele Klicks']);
  });

  it('deletes the text, not only the entry, and the export carries no deleted text', async () => {
    const { feedbackId } = await feedback['feedback.save']({
      commandId: id(92),
      householdId,
      text: 'Privat',
    });
    expect(
      await feedback['feedback.delete']({ commandId: id(93), householdId, feedbackId }),
    ).toEqual({ deleted: true });
    expect((await feedback['feedback.list']({ householdId })).answers).toEqual([]);
    expect((await storage.feedback.get(feedbackId))?.text).toBe('');
    const exported = await household['household.export']({ householdId });
    expect(JSON.stringify(exported)).not.toContain('Privat');
    expect(exported.feedback).toHaveLength(1);
  });
});

describe('shouldAskFeedback', () => {
  const base = { firstUseOn: localDate('2026-11-02'), never: false };
  it('asks after a week, then at most every two weeks', () => {
    expect(shouldAskFeedback({ ...base, today: localDate('2026-11-08') })).toBe(false);
    expect(shouldAskFeedback({ ...base, today: localDate('2026-11-09') })).toBe(true);
    const answered = { ...base, lastAnsweredOn: localDate('2026-11-10') };
    expect(shouldAskFeedback({ ...answered, today: localDate('2026-11-23') })).toBe(false);
    expect(shouldAskFeedback({ ...answered, today: localDate('2026-11-24') })).toBe(true);
  });

  it('waits after «Später» and stops after «Nicht mehr fragen»', () => {
    const today = localDate('2026-11-20');
    expect(shouldAskFeedback({ ...base, today, snoozedUntil: localDate('2026-11-23') })).toBe(
      false,
    );
    expect(shouldAskFeedback({ ...base, today, snoozedUntil: localDate('2026-11-20') })).toBe(true);
    expect(shouldAskFeedback({ ...base, today, never: true })).toBe(false);
  });
});
