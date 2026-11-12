import {
  achievements,
  addDays,
  DomainEventSchema,
  IsoDateTimeSchema,
  localDate,
  rappen,
  uuidV7,
  type AchievementId,
  type AchievementInput,
  type AchievementItem,
  type AchievementOutcome,
  type DomainEvent,
  type Id,
  type LocalDate,
} from '../src';

/** Builders for the achievement tests. */
let counter = 0;
export function id(): Id {
  counter += 1;
  const random = new Uint8Array(10);
  random[8] = counter >> 8;
  random[9] = counter & 255;
  return uuidV7(1_762_500_000_000 + counter, random);
}

export const TODAY = localDate('2026-11-12');
export const at = (date: string, time = '10:00:00') =>
  IsoDateTimeSchema.parse(`${date}T${time}.000Z`);
export const DELETED = at('2026-11-01');

export function outcome(
  date: string,
  fields: Partial<AchievementOutcome> = {},
): AchievementOutcome {
  return {
    id: id(),
    itemId: id(),
    outcome: 'eaten',
    valueRappen: rappen(100),
    valueEstimated: false,
    at: at(date),
    ...fields,
  };
}

export const rescue = (date: string, fields: Partial<AchievementOutcome> = {}) =>
  outcome(date, { rescued: true, atRisk: true, ...fields });

export function item(fields: Partial<AchievementItem> = {}): AchievementItem {
  return {
    id: id(),
    categoryId: 'dairy-milk',
    location: 'fridge',
    status: 'active',
    quantity: 1,
    unit: 'pcs',
    purchasedAt: at('2026-10-01'),
    expiresOn: localDate('2026-11-30'),
    expiryKind: 'best_before',
    ...fields,
  };
}

export function event<T extends DomainEvent['type']>(
  type: T,
  date: string,
  payload: Extract<DomainEvent, { type: T }>['payload'],
  time = '10:00:00',
): DomainEvent {
  return DomainEventSchema.parse({
    id: id(),
    type,
    version: 1,
    householdId: id(),
    actor: 'system',
    at: at(date, time),
    payload,
  });
}

export const input = (fields: Partial<AchievementInput> = {}): AchievementInput => ({
  outcomes: [],
  items: [],
  events: [],
  recipes: [],
  receipts: [],
  memberCount: 1,
  ...fields,
});

export function stateOf(
  achievementId: AchievementId,
  data: Partial<AchievementInput>,
  today: LocalDate = TODAY,
) {
  const state = achievements(input(data), today).find((entry) => entry.id === achievementId);
  if (state === undefined) {
    throw new Error(`No state for ${achievementId}`);
  }
  return state;
}

/** n days from 2026-01-01 on, one per day, so the nth item sits on its own day. */
export const nthDay = (n: number) => addDays(localDate('2026-01-01'), n);

/** The first entry of a list the test knows is not empty. */
export function first<T>(list: readonly T[]): T {
  const [entry] = list;
  if (entry === undefined) {
    throw new Error('Expected a first entry');
  }
  return entry;
}
