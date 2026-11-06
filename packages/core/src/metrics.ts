import { localDate, toLocalDate } from './dates';
import type { OutcomeEvent } from './model/inventory';
import type { LocalDate } from './model/primitives';
import { sumRappen, type Rappen } from './money';

/** What a household saved and wasted in a period (step 6, US-06). Computed, never stored. */
export interface ImpactSummary {
  /** Eaten or given away: counts as saved. */
  savedRappen: Rappen;
  wastedRappen: Rappen;
  savedGrams: number;
  wastedGrams: number;
  /** True if a value came from a category estimate instead of a receipt price. */
  estimated: boolean;
  /** Saved share of everything closed in the period (by value), 0–1; null without outcomes. */
  savedShare: number | null;
}

type OutcomeLike = Pick<
  OutcomeEvent,
  'outcome' | 'valueRappen' | 'grams' | 'valueEstimated' | 'at' | 'deletedAt'
>;

/** The first day of the month `today` is in, e.g. 2026-11-06 → 2026-11-01. */
export function startOfMonth(today: LocalDate): LocalDate {
  return localDate(`${today.slice(0, 8)}01`);
}

/**
 * Sums outcomes whose Swiss calendar day lies in [from, to]. Undone outcomes (soft-deleted) do
 * not count. Shared food counts as saved: it was eaten, just by someone else (A-02).
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
  const saved = inPeriod.filter((outcome) => outcome.outcome !== 'wasted');
  const wasted = inPeriod.filter((outcome) => outcome.outcome === 'wasted');
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
    estimated: inPeriod.some((outcome) => outcome.valueEstimated),
    savedShare:
      inPeriod.length === 0
        ? null
        : total === 0
          ? saved.length / inPeriod.length
          : savedRappen / total,
  };
}
