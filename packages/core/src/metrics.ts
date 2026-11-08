import { daysBetween, localDate, toLocalDate } from './dates';
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
  'outcome' | 'valueRappen' | 'grams' | 'valueEstimated' | 'at' | 'deletedAt' | 'atRisk' | 'rescued'
>;

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
    if (outcome.deletedAt !== undefined) {
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
