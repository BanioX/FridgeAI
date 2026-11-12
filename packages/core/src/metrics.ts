import { addDays, addMonths, daysBetween, localDate, toLocalDate } from './dates';
import { expiryStatus, soonThresholdFor } from './expiry';
import type { OutcomeEvent } from './model/inventory';
import type { DateKind, LocalDate, StorageLocation } from './model/primitives';
import { sumRappen, type Rappen } from './money';

/** What a household rescued and wasted in a period (step 6, US-06). Computed, never stored. */
export interface ImpactSummary {
  /** Rescued: eaten or given away and confirmed as a rescue (ADR-0039). Eating is not counted. */
  savedRappen: Rappen;
  wastedRappen: Rappen;
  savedGrams: number;
  wastedGrams: number;
  /** How many entries were rescued and thrown away. */
  savedCount: number;
  wastedCount: number;
  /** True if a value came from a category estimate instead of a receipt price. */
  estimated: boolean;
  /** Rescued share of everything at risk (rescued + wasted, by value), 0–1; null without any. */
  savedShare: number | null;
  /**
   * «Verwertet» (ADR-0046): everything eaten, cooked or given away, rescued or not. With
   * «Entsorgt» it gives the two rings (Alban, 8.11.2026).
   */
  usedRappen: Rappen;
  usedCount: number;
}

type OutcomeLike = Pick<
  OutcomeEvent,
  | 'outcome'
  | 'valueRappen'
  | 'grams'
  | 'valueEstimated'
  | 'at'
  | 'deletedAt'
  | 'atRisk'
  | 'rescued'
  | 'madeInto'
>;

/**
 * Whether an outcome counts in value sums: Bilanz, «Seit deinem ersten Monat», Auszüge, rescue
 * (ADR-0052). An ingredient that was processed into something («Verarbeiten») passed its value on
 * to the result, which counts when it is verwertet or entsorgt; counting both would count a cake
 * twice. Undone outcomes (soft-deleted) never count. The one place for this rule.
 */
export const countsInValue = (outcome: Pick<OutcomeLike, 'madeInto' | 'deletedAt'>): boolean =>
  outcome.madeInto === undefined && outcome.deletedAt === undefined;

/**
 * At risk (ADR-0033): it expires within `soonThresholdDays` («läuft bald ab») or is past its
 * best-before date. Past a use-by date it is not: eating that is no rescue.
 */
export function isAtRisk(
  expiresOn: LocalDate,
  expiryKind: DateKind,
  today: LocalDate,
  soonThresholdDays: number,
): boolean {
  const { kind } = expiryStatus(expiresOn, today, expiryKind, soonThresholdDays);
  return kind === 'soon' || kind === 'today' || kind === 'past_best_before';
}

/** Food that keeps a week or less is always «läuft bald ab»; eating it in time is just eating. */
const RESCUE_MIN_LIFE_DAYS = 7;

/**
 * Whether Rettich may offer «Gerettet» when an item is eaten or given away (ADR-0039, Alban
 * 8.11.2026: «Wenn ich ein Brot kaufe, das 2 Tage haltbar ist, und es esse, ist es nicht
 * gerettet»): its date is today or a best-before date is past, or it is in the «läuft bald ab»
 * days and kept longer than a week from the day it came home. Past a use-by date it is no food.
 */
export function canBeRescued(
  item: {
    expiresOn: LocalDate;
    expiryKind: DateKind;
    location: StorageLocation;
    purchasedAt: string;
  },
  today: LocalDate,
): boolean {
  const { kind } = expiryStatus(
    item.expiresOn,
    today,
    item.expiryKind,
    soonThresholdFor(item.location),
  );
  if (kind === 'today' || kind === 'past_best_before') {
    return true;
  }
  return (
    kind === 'soon' &&
    daysBetween(toLocalDate(item.purchasedAt), item.expiresOn) > RESCUE_MIN_LIFE_DAYS
  );
}

/**
 * Rescued: eaten or shared, and the person confirmed that it would otherwise have been thrown
 * away (ADR-0039). Ordinary eating is consumption, not a rescue.
 */
export const isRescue = (outcome: Pick<OutcomeEvent, 'outcome' | 'rescued'>): boolean =>
  outcome.outcome !== 'wasted' && outcome.rescued === true;

/** The first day of the month `today` is in, e.g. 2026-11-06 → 2026-11-01. */
export function startOfMonth(today: LocalDate): LocalDate {
  return localDate(`${today.slice(0, 8)}01`);
}

/**
 * Sums outcomes whose Swiss calendar day lies in [from, to]. Undone outcomes (soft-deleted) do
 * not count. Rescued is food eaten or shared while at risk (ADR-0033); shared food counts like
 * eaten food, just by someone else (A-02). Food eaten before it was at risk counts nowhere here.
 */
export function summarizeImpact(
  outcomes: readonly OutcomeLike[],
  from: LocalDate,
  to: LocalDate,
): ImpactSummary {
  const inPeriod = outcomes.filter((outcome) => {
    if (!countsInValue(outcome)) {
      return false;
    }
    const day = toLocalDate(outcome.at);
    return day >= from && day <= to;
  });
  const saved = inPeriod.filter(isRescue);
  const wasted = inPeriod.filter((outcome) => outcome.outcome === 'wasted');
  const used = inPeriod.filter((outcome) => outcome.outcome !== 'wasted');
  const value = (list: readonly OutcomeLike[]) => sumRappen(list.map((item) => item.valueRappen));
  const grams = (list: readonly OutcomeLike[]) =>
    list.reduce((total, item) => total + (item.grams ?? 0), 0);
  const savedRappen = value(saved);
  const wastedRappen = value(wasted);
  const total = savedRappen + wastedRappen;
  return {
    savedRappen,
    wastedRappen,
    savedGrams: grams(saved),
    wastedGrams: grams(wasted),
    savedCount: saved.length,
    wastedCount: wasted.length,
    usedRappen: value(used),
    usedCount: used.length,
    estimated: [...used, ...wasted].some((outcome) => outcome.valueEstimated),
    savedShare:
      saved.length + wasted.length === 0
        ? null
        : total === 0
          ? saved.length / (saved.length + wasted.length)
          : savedRappen / total,
  };
}

/**
 * Entsorgt in the last completed month against the household's first completed month (G1,
 * ADR-0050). Months are first days (`YYYY-MM-01`) in Swiss time; `changePercent` is negative
 * when less is thrown away.
 */
export interface WasteComparison {
  firstMonth: LocalDate;
  lastMonth: LocalDate;
  firstWastedRappen: Rappen;
  lastWastedRappen: Rappen;
  /** Whole percent against the first month; below 0 is better, above 0 is worse. */
  changePercent: number;
}

/**
 * The household's first full month (ADR-0050): the first month that starts on or after the day of
 * the first recorded outcome. Null without outcomes. Undone outcomes do not count.
 */
export function firstFullMonth(outcomes: readonly OutcomeLike[]): LocalDate | null {
  const days = outcomes
    .filter((outcome) => outcome.deletedAt === undefined)
    .map((outcome) => toLocalDate(outcome.at))
    .sort();
  const firstDay = days[0];
  if (firstDay === undefined) {
    return null;
  }
  return firstDay === startOfMonth(firstDay) ? firstDay : addMonths(startOfMonth(firstDay), 1);
}

/**
 * Compares full calendar months only (ADR-0050): the first month is the first one that starts on
 * or after the day of the first recorded outcome, the last is the month before `today`'s. Null
 * until they are two different months and the first one had something entsorgt (no division by
 * zero, no made-up percentage). Undone outcomes do not count.
 */
export function compareWasteSinceFirstMonth(
  outcomes: readonly OutcomeLike[],
  today: LocalDate,
): WasteComparison | null {
  const firstMonth = firstFullMonth(outcomes);
  if (firstMonth === null) {
    return null;
  }
  const lastMonth = addMonths(startOfMonth(today), -1);
  if (firstMonth >= lastMonth) {
    return null;
  }
  const wastedIn = (month: LocalDate) =>
    summarizeImpact(outcomes, month, addDays(addMonths(month, 1), -1)).wastedRappen;
  const first = wastedIn(firstMonth);
  if (first === 0) {
    return null;
  }
  const last = wastedIn(lastMonth);
  const ratio = (100 * (last - first)) / first;
  return {
    firstMonth,
    lastMonth,
    firstWastedRappen: first,
    lastWastedRappen: last,
    // Symmetric rounding: 37.5 % less and 37.5 % more both round away from zero.
    changePercent: Math.sign(ratio) * Math.round(Math.abs(ratio)) || 0,
  };
}
