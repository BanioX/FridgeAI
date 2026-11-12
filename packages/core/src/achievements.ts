import { ACHIEVEMENTS, type AchievementFamily, type AchievementId } from './achievements-catalogue';
import { categoryById } from './catalog/match';
import type { DomainEvent } from './contract/events';
import { addDays, addMonths, daysBetween, toLocalDate } from './dates';
import type { Id } from './ids';
import { countsInValue, firstFullMonth, isRescue, startOfMonth, summarizeImpact } from './metrics';
import type { InventoryItem, OutcomeEvent } from './model/inventory';
import type { IsoDateTime, LocalDate } from './model/primitives';
import { knownGrams } from './quantity';

export * from './achievements-catalogue';

/** An outcome as the computation reads it (a stored `OutcomeEvent` fits). */
export type AchievementOutcome = Pick<
  OutcomeEvent,
  'id' | 'itemId' | 'outcome' | 'valueRappen' | 'valueEstimated' | 'at'
> &
  Partial<Pick<OutcomeEvent, 'deletedAt' | 'atRisk' | 'rescued' | 'madeInto' | 'wasteReason'>>;

/** An item with its category, as the computation reads it. */
export type AchievementItem = Pick<
  InventoryItem,
  'id' | 'location' | 'status' | 'quantity' | 'unit' | 'purchasedAt' | 'expiresOn' | 'expiryKind'
> &
  Partial<Pick<InventoryItem, 'packageSize' | 'origin' | 'deletedAt'>> & { categoryId: string };

export interface AchievementInput {
  /** Every outcome of the household; undone ones carry `deletedAt` and do not count. */
  outcomes: readonly AchievementOutcome[];
  /** Every item of the household; deleted ones carry `deletedAt` and do not count. */
  items: readonly AchievementItem[];
  /** The household's domain events (`item.processed`, `item.moved`, `receipt.imported`, …). */
  events: readonly DomainEvent[];
  /** Own recipes, deleted ones included (they carry `deletedAt`). */
  recipes: readonly { id: Id; createdAt: IsoDateTime; deletedAt?: IsoDateTime | undefined }[];
  /** Receipts, deleted ones included. */
  receipts: readonly { id: Id; deletedAt?: IsoDateTime | undefined }[];
  /** Members of the household (for the Notvorrat water). */
  memberCount: number;
}

export interface AchievementState {
  id: AchievementId;
  family: AchievementFamily;
  /** 0 = not reached; one-time achievements are 0 or 1. */
  tier: 0 | 1 | 2 | 3;
  /** The day (Europe/Zurich) the current tier was first reached; computed from the data. */
  reachedOn: LocalDate | null;
  /**
   * Where the person stands, in the unit of the achievement, and what the next tier needs; `next`
   * is null at the top tier and for a reached one-time achievement.
   */
  progress: { current: number; next: number | null };
}

/** How one achievement is measured: the value now and the first day each threshold was met. */
interface Measure {
  current: number;
  reach: (threshold: number) => LocalDate | undefined;
}

/** «Ten closings» (docs/abzeichen.md, principle 6): a month or period needs this to count. */
const MIN_CLOSINGS = 10;
/** Alles im Blick: this many days in a row. */
const OVERVIEW_DAYS = 30;
const MAX_SPAN_DAYS = 3660;
/** Notvorrat (BWL): 9 litres of water per person, food from four of five groups. */
const WATER_LITRES_PER_PERSON = 9;
const FOOD_GROUPS_NEEDED = 4;
/** The ingredient outcomes of a «Gekocht» without a result are written just before its event. */
const COOKED_WINDOW_MS = 60_000;

/** Notvorrat food groups (ADR-0053): the catalogue's groups mapped to categories. */
const FOOD_GROUP_OF: Record<string, string> = {
  'pantry-rice': 'grain',
  'pantry-pasta': 'grain',
  'pantry-oil': 'fat',
  'pantry-canned': 'canned',
  'pantry-flour': 'flour',
  'reserve-freeze-dried': 'meals',
  'reserve-rations': 'meals',
};

type ProcessedEvent = Extract<DomainEvent, { type: 'item.processed' }>;

const day = (instant: string): LocalDate => toLocalDate(instant);
const byAt = (a: { at: string }, b: { at: string }) => a.at.localeCompare(b.at);

/** Monday of the week a day is in. */
function mondayOf(date: LocalDate): LocalDate {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

/** Count-like achievements: the nth event reaches threshold n. */
const fromDays = (days: readonly LocalDate[]): Measure => {
  const sorted = [...days].sort();
  return { current: sorted.length, reach: (threshold) => sorted[threshold - 1] };
};

/** Sum-like achievements: the first point where the running total reaches the threshold. */
function fromSum(points: readonly { on: LocalDate; value: number }[]): Measure {
  const sorted = [...points].sort((a, b) => a.on.localeCompare(b.on));
  const totals: number[] = [];
  let total = 0;
  for (const point of sorted) {
    total += point.value;
    totals.push(total);
  }
  return {
    current: total,
    reach: (threshold) => {
      const index = totals.findIndex((value) => value >= threshold);
      return index < 0 ? undefined : sorted[index]?.on;
    },
  };
}

/**
 * The achievements of a household (docs/abzeichen.md, ADR-0053): per achievement the tier, the day
 * it was reached and the progress. Pure and computed on every call from the household's own data;
 * nothing is stored (ADR-0020). Outcomes that were undone and rows that were deleted do not count.
 */
export function achievements(input: AchievementInput, today: LocalDate): AchievementState[] {
  const outcomes = input.outcomes.filter((outcome) => outcome.deletedAt === undefined);
  const itemById = new Map(input.items.map((item) => [item.id, item]));
  const liveItem = (itemId: Id) => {
    const item = itemById.get(itemId);
    return item?.deletedAt === undefined ? item : undefined;
  };
  const live = (itemId: Id) => liveItem(itemId) !== undefined;
  const eatenOutcomes = outcomes.filter((outcome) => outcome.outcome === 'eaten');

  const rescues = outcomes.filter((outcome) => countsInValue(outcome) && isRescue(outcome));
  const rescueDays = rescues.map((outcome) => day(outcome.at));

  const lastDay = eatenOutcomes.filter((outcome) => {
    const item = liveItem(outcome.itemId);
    return item?.expiresOn === day(outcome.at);
  });
  const allSenses = eatenOutcomes.filter((outcome) => {
    const item = liveItem(outcome.itemId);
    return item?.expiryKind === 'best_before' && day(outcome.at) > item.expiresOn;
  });

  const months = closedMonths(outcomes, today);
  const events = input.events;
  const processed = events
    .filter((event): event is ProcessedEvent => event.type === 'item.processed')
    .filter((event) => processedStands(event, itemById, outcomes))
    .sort(byAt);

  const measures: Record<AchievementId, Measure> = {
    'first-rescue': fromDays(rescueDays),
    'rescue-service': fromDays(rescueDays),
    savings: fromSum(
      rescues.map((outcome) => ({ on: day(outcome.at), value: outcome.valueRappen })),
    ),
    'last-day': fromDays(lastDay.map((outcome) => day(outcome.at))),
    'all-senses': fromDays(allSenses.map((outcome) => day(outcome.at))),
    frugal: fromDays(months.filter((month) => month.frugal).map((month) => month.closedOn)),
    'nothing-wasted': fromDays(
      months.filter((month) => month.nothingWasted).map((month) => month.closedOn),
    ),
    progress: progressMeasure(outcomes, months, today),
    'year-end': yearEnd(outcomes, today),
    'at-the-stove': fromDays(
      processed.filter((e) => e.payload.recipeId !== undefined).map((e) => day(e.at)),
    ),
    bakery: fromDays(
      processed
        .filter((event) => event.payload.kind === 'made')
        .filter((event) => {
          const result =
            event.payload.resultId === undefined ? undefined : itemById.get(event.payload.resultId);
          return result !== undefined && categoryById(result.categoryId)?.group === 'bakery';
        })
        .map((event) => day(event.at)),
    ),
    'leftover-kitchen': fromDays(leftoverDays(input.items, outcomes)),
    'own-cookbook': fromDays(
      input.recipes
        .filter((recipe) => recipe.deletedAt === undefined)
        .map((recipe) => day(recipe.createdAt)),
    ),
    foresight: fromDays(foresightDays(events, live)),
    overview: overviewMeasure(input.items, outcomes, today),
    loyal: loyalMeasure(events, today),
    survival: survivalMeasure(input, events),
    bookkeeping: bookkeepingMeasure(events, input.receipts),
  };

  return ACHIEVEMENTS.map((spec) => {
    const measure = measures[spec.id];
    const thresholds: readonly number[] = spec.thresholds;
    const reached = thresholds.filter((threshold) => measure.reach(threshold) !== undefined).length;
    const tier = Math.min(reached, 3) as AchievementState['tier'];
    const threshold = thresholds[tier - 1];
    return {
      id: spec.id,
      family: spec.family,
      tier,
      reachedOn: threshold === undefined ? null : (measure.reach(threshold) ?? null),
      progress: { current: measure.current, next: thresholds[tier] ?? null },
    };
  });
}

interface ClosedMonth {
  /** The day the month was complete: the first day of the next month. */
  closedOn: LocalDate;
  month: LocalDate;
  closings: number;
  wastedRappen: number;
  frugal: boolean;
  nothingWasted: boolean;
}

/**
 * Completed calendar months with at least 10 closings (verwertet or entsorgt), like the «Bilanz»
 * counts them: an ingredient that moved into a new item counts only once (ADR-0052). An empty
 * month is no frugal month (principle 6). Frugal: under 5 % entsorgt by value, by count when no
 * value is known.
 */
function closedMonths(outcomes: readonly AchievementOutcome[], today: LocalDate): ClosedMonth[] {
  const first = firstFullMonth(outcomes);
  const last = addMonths(startOfMonth(today), -1);
  const result: ClosedMonth[] = [];
  if (first === null) {
    return result;
  }
  for (let month = first; month <= last; month = addMonths(month, 1)) {
    if (result.length > MAX_SPAN_DAYS / 28) {
      break;
    }
    const impact = summarizeImpact(outcomes, month, addDays(addMonths(month, 1), -1));
    const closings = impact.usedCount + impact.wastedCount;
    if (closings < MIN_CLOSINGS) {
      continue;
    }
    const total = impact.usedRappen + impact.wastedRappen;
    result.push({
      closedOn: addMonths(month, 1),
      month,
      closings,
      wastedRappen: impact.wastedRappen,
      frugal:
        total > 0 ? impact.wastedRappen * 100 < total * 5 : impact.wastedCount * 100 < closings * 5,
      nothingWasted: impact.wastedCount === 0,
    });
  }
  return result;
}

/**
 * Fortschritt (ADR-0050): the best reduction of a completed month (with at least 10 closings)
 * against the first full month, in whole percent. Nothing without a baseline that had something
 * entsorgt. The tier follows the best month ever reached.
 */
function progressMeasure(
  outcomes: readonly AchievementOutcome[],
  months: readonly ClosedMonth[],
  today: LocalDate,
): Measure {
  const first = firstFullMonth(outcomes);
  const none: Measure = { current: 0, reach: () => undefined };
  if (first === null || first >= startOfMonth(today)) {
    return none;
  }
  const base = summarizeImpact(outcomes, first, addDays(addMonths(first, 1), -1)).wastedRappen;
  if (base === 0) {
    return none;
  }
  const reductions = months
    .filter((month) => month.month > first)
    .map((month) => ({
      closedOn: month.closedOn,
      percent: Math.round((100 * (base - month.wastedRappen)) / base),
    }));
  return {
    current: Math.max(0, ...reductions.map((entry) => entry.percent)),
    reach: (threshold) => reductions.find((entry) => entry.percent >= threshold)?.closedOn,
  };
}

/** Jahresabschluss: 365 days since the first closing. */
function yearEnd(outcomes: readonly AchievementOutcome[], today: LocalDate): Measure {
  const first = outcomes.map((outcome) => day(outcome.at)).sort()[0];
  if (first === undefined) {
    return { current: 0, reach: () => undefined };
  }
  return {
    current: Math.max(0, daysBetween(first, today)),
    reach: (threshold) =>
      daysBetween(first, today) >= threshold ? addDays(first, threshold) : undefined,
  };
}

/**
 * Whether an `item.processed` event still stands (ADR-0052, point 7): «Rückgängig» deletes the
 * result item and the ingredient outcomes instead of retracting the event, so the event counts
 * only while its result exists, or, without a result, while an ingredient outcome from that moment
 * is still there.
 */
function processedStands(
  event: ProcessedEvent,
  itemById: ReadonlyMap<Id, AchievementItem>,
  outcomes: readonly AchievementOutcome[],
): boolean {
  const { resultId, ingredientIds } = event.payload;
  if (resultId !== undefined) {
    const result = itemById.get(resultId);
    if (result === undefined || result.deletedAt !== undefined) {
      return false;
    }
    return ingredientIds.length === 0 || outcomes.some((outcome) => outcome.madeInto === resultId);
  }
  const at = Date.parse(event.at);
  return outcomes.some(
    (outcome) =>
      outcome.outcome === 'eaten' &&
      ingredientIds.includes(outcome.itemId) &&
      Math.abs(at - Date.parse(outcome.at)) <= COOKED_WINDOW_MS,
  );
}

/**
 * Resteküche: Reste that were verwertet (eaten or given away, not thrown away), one per item, on
 * the day of their last such outcome.
 */
function leftoverDays(
  items: readonly AchievementItem[],
  outcomes: readonly AchievementOutcome[],
): LocalDate[] {
  return items
    .filter(
      (item) =>
        item.origin === 'leftover' &&
        item.deletedAt === undefined &&
        (item.status === 'eaten' || item.status === 'shared_out'),
    )
    .flatMap((item) => {
      const last = outcomes
        .filter((outcome) => outcome.itemId === item.id && outcome.outcome !== 'wasted')
        .sort(byAt)
        .at(-1);
      return last === undefined ? [] : [day(last.at)];
    });
}

/**
 * Vorausschauend: items moved into the freezer while their date was not yet past, one per item.
 * A move without the old date (before ADR-0053) counts; the app cannot tell, and the freeze hint
 * only offers food that is still good.
 */
function foresightDays(events: readonly DomainEvent[], live: (itemId: Id) => boolean): LocalDate[] {
  const first = new Map<Id, LocalDate>();
  for (const event of [...events].sort(byAt)) {
    if (
      event.type !== 'item.moved' ||
      event.payload.to !== 'freezer' ||
      event.payload.from === 'freezer'
    ) {
      continue;
    }
    const { itemId, previousExpiresOn } = event.payload;
    const movedOn = day(event.at);
    if (
      live(itemId) &&
      !first.has(itemId) &&
      (previousExpiresOn === undefined || movedOn <= previousExpiresOn)
    ) {
      first.set(itemId, movedOn);
    }
  }
  return [...first.values()];
}

/** Buchhaltung: receipts taken over, each once, as long as the receipt still exists. */
function bookkeepingMeasure(
  events: readonly DomainEvent[],
  receipts: AchievementInput['receipts'],
): Measure {
  const liveReceipts = new Set(
    receipts.filter((receipt) => receipt.deletedAt === undefined).map((receipt) => receipt.id),
  );
  const first = new Map<Id, LocalDate>();
  for (const event of [...events].sort(byAt)) {
    if (
      event.type === 'receipt.imported' &&
      liveReceipts.has(event.payload.receiptId) &&
      !first.has(event.payload.receiptId)
    ) {
      first.set(event.payload.receiptId, day(event.at));
    }
  }
  return fromDays([...first.values()]);
}

/**
 * Treu: weeks (Monday to Sunday) in a row with at least one finished fridge check. The tier
 * follows the longest run ever; the progress shows the run that is still alive, which ends only
 * when a whole week passed without a check («diese Woche noch offen» is not a break).
 */
function loyalMeasure(events: readonly DomainEvent[], today: LocalDate): Measure {
  const firstCheckOfWeek = new Map<LocalDate, LocalDate>();
  for (const event of events) {
    if (event.type === 'check.completed') {
      const checked = day(event.at);
      const week = mondayOf(checked);
      const known = firstCheckOfWeek.get(week);
      if (known === undefined || checked < known) {
        firstCheckOfWeek.set(week, checked);
      }
    }
  }
  const weeks = [...firstCheckOfWeek.keys()].sort();
  const runs: { week: LocalDate; on: LocalDate }[][] = [];
  for (const week of weeks) {
    const run = runs.at(-1);
    const previous = run?.at(-1);
    const entry = { week, on: firstCheckOfWeek.get(week) ?? week };
    if (run !== undefined && previous !== undefined && daysBetween(previous.week, week) === 7) {
      run.push(entry);
    } else {
      runs.push([entry]);
    }
  }
  const thisWeek = mondayOf(today);
  const lastRun = runs.at(-1);
  const lastWeek = lastRun?.at(-1)?.week;
  const alive = lastWeek === thisWeek || lastWeek === addDays(thisWeek, -7);
  return {
    current: alive ? (lastRun?.length ?? 0) : 0,
    reach: (threshold) =>
      runs
        .flatMap((run) => (run.length >= threshold ? [run[threshold - 1]?.on] : []))
        .filter((on): on is LocalDate => on !== undefined)
        .sort()[0],
  };
}

/**
 * Alles im Blick: 30 days in a row in which no fridge item was left over its date and none was
 * thrown away as «abgelaufen», with at least 10 closings in those days. An item is over its date
 * from the day after it until it was closed (or today, if it is still there); a best-before date
 * counts like a use-by date. Fridge items are judged by where they are now.
 */
function overviewMeasure(
  items: readonly AchievementItem[],
  outcomes: readonly AchievementOutcome[],
  today: LocalDate,
): Measure {
  const first = outcomes.map((outcome) => day(outcome.at)).sort()[0];
  const none: Measure = { current: 0, reach: () => undefined };
  if (first === undefined) {
    return none;
  }
  const span = Math.min(daysBetween(first, today) + 1, MAX_SPAN_DAYS);
  const from = addDays(today, -(span - 1));
  const index = (date: LocalDate) => daysBetween(from, date);
  const over = new Array<boolean>(span).fill(false);
  const closings = new Array<number>(span).fill(0);
  const mark = (start: LocalDate, end: LocalDate) => {
    for (let at = Math.max(index(start), 0); at <= Math.min(index(end), span - 1); at += 1) {
      over[at] = true;
    }
  };

  const fridge = new Map(
    items
      .filter((item) => item.location === 'fridge' && item.deletedAt === undefined)
      .filter((item) => categoryById(item.categoryId)?.group !== 'non_food')
      .map((item) => [item.id, item]),
  );
  const lastOutcome = new Map<Id, LocalDate>();
  for (const outcome of [...outcomes].sort(byAt)) {
    lastOutcome.set(outcome.itemId, day(outcome.at));
    const item = fridge.get(outcome.itemId);
    if (item !== undefined && outcome.outcome === 'wasted' && outcome.wasteReason === 'expired') {
      mark(day(outcome.at), day(outcome.at));
    }
    if (countsInValue(outcome)) {
      const at = index(day(outcome.at));
      if (at >= 0 && at < span) {
        closings[at] = (closings[at] ?? 0) + 1;
      }
    }
  }
  for (const item of fridge.values()) {
    const bought = day(item.purchasedAt);
    const start = addDays(item.expiresOn, 1) > bought ? addDays(item.expiresOn, 1) : bought;
    const end = item.status === 'active' ? today : lastOutcome.get(item.id);
    if (end !== undefined) {
      mark(start, end);
    }
  }

  let reachedOn: LocalDate | undefined;
  let overCount = 0;
  let closingCount = 0;
  for (let at = 0; at < span; at += 1) {
    overCount += over[at] === true ? 1 : 0;
    closingCount += closings[at] ?? 0;
    if (at >= OVERVIEW_DAYS) {
      overCount -= over[at - OVERVIEW_DAYS] === true ? 1 : 0;
      closingCount -= closings[at - OVERVIEW_DAYS] ?? 0;
    }
    if (at >= OVERVIEW_DAYS - 1 && overCount === 0 && closingCount >= MIN_CLOSINGS) {
      reachedOn = addDays(from, at);
      break;
    }
  }
  let streak = 0;
  while (streak < span && over[span - 1 - streak] !== true) {
    streak += 1;
  }
  return {
    current: reachedOn === undefined ? Math.min(streak, OVERVIEW_DAYS - 1) : OVERVIEW_DAYS,
    reach: (threshold) =>
      reachedOn !== undefined && threshold <= OVERVIEW_DAYS ? reachedOn : undefined,
  };
}

/** The litres of drinking water in an item (ml count like g; a piece without size is a typical pack). */
function litresOf(item: AchievementItem): number {
  const grams =
    knownGrams(item.quantity, item.unit, item.packageSize) ??
    (categoryById(item.categoryId)?.avgWeightGrams ?? 0) * item.quantity;
  return grams / 1000;
}

/**
 * Überlebenskunst (BWL): in the Notvorrat 9 litres of drinking water per member and food from at
 * least four of the five groups (Reis oder Teigwaren, Öl oder Fett, Konserven, Mehl, Fertiges für
 * eine Woche). Judged by what is in the Notvorrat now; the day it was reached is the day the last
 * piece that completed it arrived there. Progress counts the two parts met (0 to 2).
 */
function survivalMeasure(input: AchievementInput, events: readonly DomainEvent[]): Measure {
  const needed = WATER_LITRES_PER_PERSON * Math.max(1, input.memberCount);
  const arrivedByMove = new Map<Id, LocalDate>();
  for (const event of [...events].sort(byAt)) {
    if (event.type === 'item.moved' && event.payload.to === 'reserve') {
      arrivedByMove.set(event.payload.itemId, day(event.at));
    }
  }
  const stock = input.items
    .filter(
      (item) =>
        item.location === 'reserve' && item.status === 'active' && item.deletedAt === undefined,
    )
    .map((item) => {
      const bought = day(item.purchasedAt);
      const moved = arrivedByMove.get(item.id);
      return { item, arrived: moved !== undefined && moved > bought ? moved : bought };
    })
    .sort((a, b) => a.arrived.localeCompare(b.arrived));

  let water = 0;
  const groups = new Set<string>();
  let reachedOn: LocalDate | undefined;
  for (const { item, arrived } of stock) {
    if (item.categoryId === 'reserve-water') {
      water += litresOf(item);
    }
    const group = FOOD_GROUP_OF[item.categoryId];
    if (group !== undefined) {
      groups.add(group);
    }
    if (reachedOn === undefined && water >= needed && groups.size >= FOOD_GROUPS_NEEDED) {
      reachedOn = arrived;
    }
  }
  return {
    current: (water >= needed ? 1 : 0) + (groups.size >= FOOD_GROUPS_NEEDED ? 1 : 0),
    reach: (threshold) => (threshold <= 2 && reachedOn !== undefined ? reachedOn : undefined),
  };
}
