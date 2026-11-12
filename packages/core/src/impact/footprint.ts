import { toLocalDate } from '../dates';
import { countsInValue, isRescue } from '../metrics';
import type { OutcomeEvent } from '../model/inventory';
import type { LocalDate, PackageSize, Unit } from '../model/primitives';
import { knownGrams } from '../quantity';
import { categoryById } from '../catalog/match';
import { DEFAULT_CURRENCY, type CurrencyCode } from '../currency';
import { rappen, type Rappen } from '../money';
import { footprintPerKg, PIECE_GRAMS } from './category-footprint';

/**
 * Footprint of rescued and wasted food in a period (ADR-0057): the weight, the greenhouse gases
 * (CO2e), the freshwater and the land that went into producing it, from the per-kg figures of
 * Clark et al. (2022). Computed, never stored. It says how much went into making the food, not
 * what the person «saved» in total.
 */

/** An outcome with what the footprint needs to know about its item. */
export type FootprintOutcome = Pick<
  OutcomeEvent,
  'outcome' | 'quantity' | 'grams' | 'at' | 'deletedAt' | 'rescued' | 'madeInto'
> & {
  categoryId: string;
  /** Unit and package size of the item; without them pieces fall back to a typical weight. */
  unit?: Unit | undefined;
  packageSize?: PackageSize | undefined;
};

export interface FootprintTotals {
  /** Entries that count (food with a footprint figure). */
  count: number;
  grams: number;
  co2eGrams: number;
  waterLitres: number;
  /** m², one decimal. */
  landM2: number;
  /** Share of the weight that rests on an estimate (stand-in product or piece weight), 0–1. */
  estimatedShare: number;
}

export interface FootprintCategory {
  categoryId: string;
  grams: number;
  co2eGrams: number;
}

/** Waste fee estimate: bags of 35 litres and what they would cost (CHF only). */
export interface KehrichtEstimate {
  /** Bags à 35 litres, one decimal. */
  bags: number;
  feeRappen: Rappen;
}

export interface FootprintSummary {
  rescued: FootprintTotals;
  wasted: FootprintTotals;
  /** Categories with the most CO2e among the rescued food, most first. */
  topCategories: FootprintCategory[];
  /** For the rescued weight; null unless the household currency is CHF (ADR-0019). */
  kehricht: KehrichtEstimate | null;
}

/**
 * The Preisüberwacher converts waste fees to a typical 35-litre bag with 4.89 kg of waste
 * (Erläuterungen zum Preisvergleich Abfall,
 * https://www.preisvergleiche.preisueberwacher.admin.ch/resource/pdf/Erlaeuterungen.pdf).
 * Example fee: CHF 16.00 per roll of ten 35-litre bags, so CHF 1.60 per bag, in Horgen and Maur
 * in 2024 (https://horgen.ch/_doc/4976437,
 * https://www.maur.ch/verwaltung/dienstleistungen-az.html/5/print/pdf/service/529). Fees differ by
 * Gemeinde and food may go to the Grüngut instead: always shown as an estimate.
 */
export const KEHRICHT = {
  bagLitres: 35,
  bagGrams: 4890,
  bagFeeRappen: 160,
} as const;

/** The estimate for a weight; null unless the household currency is CHF. */
export function kehrichtEstimate(
  grams: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): KehrichtEstimate | null {
  if (currency !== DEFAULT_CURRENCY) {
    return null;
  }
  return {
    bags: Math.round((10 * grams) / KEHRICHT.bagGrams) / 10,
    feeRappen: rappen(Math.round((grams * KEHRICHT.bagFeeRappen) / KEHRICHT.bagGrams)),
  };
}

/**
 * The weight of an outcome in grams and whether it is an estimate: the recorded grams, else
 * what quantity, unit and package size tell (millilitres count as grams), else the typical piece
 * weight of the category, else its typical pack. Pieces without a package size are estimates.
 */
export function outcomeWeight(outcome: FootprintOutcome): { grams: number; estimated: boolean } {
  const pieces = outcome.unit === 'pcs' && outcome.packageSize === undefined;
  if (outcome.grams !== undefined) {
    return { grams: outcome.grams, estimated: pieces };
  }
  if (outcome.unit !== undefined) {
    const known = knownGrams(outcome.quantity, outcome.unit, outcome.packageSize);
    if (known !== undefined) {
      return { grams: known, estimated: false };
    }
  }
  const piece = PIECE_GRAMS[outcome.categoryId] ?? categoryById(outcome.categoryId)?.avgWeightGrams;
  return piece === undefined
    ? { grams: 0, estimated: true }
    : { grams: Math.round(piece * outcome.quantity), estimated: true };
}

interface Sum {
  count: number;
  grams: number;
  co2eGrams: number;
  waterLitres: number;
  landM2: number;
  estimatedGrams: number;
}

const emptySum = (): Sum => ({
  count: 0,
  grams: 0,
  co2eGrams: 0,
  waterLitres: 0,
  landM2: 0,
  estimatedGrams: 0,
});

const totalsOf = (sum: Sum): FootprintTotals => ({
  count: sum.count,
  grams: Math.round(sum.grams),
  co2eGrams: Math.round(sum.co2eGrams),
  waterLitres: Math.round(sum.waterLitres),
  landM2: Math.round(sum.landM2 * 10) / 10,
  estimatedShare: sum.grams === 0 ? 0 : Math.round((100 * sum.estimatedGrams) / sum.grams) / 100,
});

/** The most categories `topCategories` lists. */
export const FOOTPRINT_TOP_CATEGORIES = 3;

/**
 * Sums the footprint of outcomes whose Swiss calendar day lies in [from, to]. Counted like the
 * Bilanz (`countsInValue`, ADR-0052): undone outcomes and ingredients that were processed into
 * something do not count, so a cake is not counted twice. Rescued is `isRescue` (ADR-0039),
 * entsorgt is `wasted`; food that was merely eaten counts nowhere. Categories without a footprint
 * figure (no food, water) are left out.
 */
export function summarizeFootprint(
  outcomes: readonly FootprintOutcome[],
  from: LocalDate,
  to: LocalDate,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): FootprintSummary {
  const rescued = emptySum();
  const wasted = emptySum();
  const byCategory = new Map<string, { grams: number; co2eGrams: number }>();
  for (const outcome of outcomes) {
    if (!countsInValue(outcome)) {
      continue;
    }
    const day = toLocalDate(outcome.at);
    if (day < from || day > to) {
      continue;
    }
    const isRescued = isRescue(outcome);
    if (!isRescued && outcome.outcome !== 'wasted') {
      continue;
    }
    const figure = footprintPerKg(outcome.categoryId);
    if (figure === undefined) {
      continue;
    }
    const weight = outcomeWeight(outcome);
    const kg = weight.grams / 1000;
    const co2eGrams = figure.perKg.ghgKgCo2ePerKg * weight.grams;
    const sum = isRescued ? rescued : wasted;
    sum.count += 1;
    sum.grams += weight.grams;
    sum.co2eGrams += co2eGrams;
    sum.waterLitres += figure.perKg.waterLitresPerKg * kg;
    sum.landM2 += figure.perKg.landM2PerKg * kg;
    if (figure.estimated || weight.estimated) {
      sum.estimatedGrams += weight.grams;
    }
    if (isRescued) {
      const entry = byCategory.get(outcome.categoryId) ?? { grams: 0, co2eGrams: 0 };
      entry.grams += weight.grams;
      entry.co2eGrams += co2eGrams;
      byCategory.set(outcome.categoryId, entry);
    }
  }
  const rescuedTotals = totalsOf(rescued);
  return {
    rescued: rescuedTotals,
    wasted: totalsOf(wasted),
    topCategories: [...byCategory]
      .map(([categoryId, entry]) => ({
        categoryId,
        grams: Math.round(entry.grams),
        co2eGrams: Math.round(entry.co2eGrams),
      }))
      .filter((entry) => entry.co2eGrams > 0)
      .sort((a, b) => b.co2eGrams - a.co2eGrams || a.categoryId.localeCompare(b.categoryId))
      .slice(0, FOOTPRINT_TOP_CATEGORIES),
    kehricht: rescuedTotals.grams === 0 ? null : kehrichtEstimate(rescuedTotals.grams, currency),
  };
}
