import { daysBetween } from '../dates';
import { rappen, type Rappen } from '../money';
import type { LocalDate, Retailer } from '../model/primitives';

/** One price the household actually paid, from a receipt line (ADR-0029). */
export interface PriceObservation {
  retailer: Retailer;
  storeName?: string;
  purchasedOn: LocalDate;
  quantity: number;
  unit: 'pcs' | 'g' | 'ml';
  /** What was paid for the line, after promotions and discounts. */
  paidRappen: Rappen;
  /** The line carried a discount («Aktion», «Gespart», «Rabatt»). */
  promotion: boolean;
}

export type PricedObservation = PriceObservation & { unitPriceRappen: Rappen };

export interface PriceSummary {
  /** Observations of the same unit as the latest one. */
  count: number;
  last: PricedObservation;
  /** Median price per piece, kilogram or litre over the last 120 days; needs two prices. */
  usualUnitPriceRappen?: Rappen;
  /** Lowest price per unit over the last 120 days; needs two prices. */
  cheapest?: PricedObservation;
}

/** How far back «usual» and «cheapest» look. */
export const PRICE_WINDOW_DAYS = 120;
/** Smaller differences are noise (rounding, a few Rappen of «Aktion»). */
const NOTICEABLE_PERCENT = 5;

/** Price per piece, per kilogram or per litre, so different pack sizes compare. */
export function unitPrice(observation: Pick<PriceObservation, 'paidRappen' | 'quantity' | 'unit'>) {
  if (!(observation.quantity > 0)) {
    return null;
  }
  const per = observation.unit === 'pcs' ? 1 : 1000;
  return rappen(Math.round((observation.paidRappen * per) / observation.quantity));
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;
  return sorted.length % 2 === 1 ? upper : Math.round(((sorted[middle - 1] ?? 0) + upper) / 2);
}

/**
 * The price memory of one product (ADR-0029): what was paid last, the usual price and where it
 * was cheapest lately. Only prices in the same unit as the latest one count, compared per piece,
 * kilogram or litre.
 */
export function summarizePrices(
  observations: readonly PriceObservation[],
  today: LocalDate,
): PriceSummary | null {
  const priced = observations
    .flatMap((observation) => {
      const perUnit = unitPrice(observation);
      return perUnit === null ? [] : [{ ...observation, unitPriceRappen: perUnit }];
    })
    .sort((a, b) => daysBetween(b.purchasedOn, a.purchasedOn));
  const last = priced.at(-1);
  if (last === undefined) {
    return null;
  }
  const sameUnit = priced.filter((observation) => observation.unit === last.unit);
  const recent = sameUnit.filter(
    (observation) => daysBetween(observation.purchasedOn, today) <= PRICE_WINDOW_DAYS,
  );
  if (recent.length < 2) {
    return { count: sameUnit.length, last };
  }
  const cheapest = recent.reduce((best, observation) =>
    observation.unitPriceRappen <= best.unitPriceRappen ? observation : best,
  );
  return {
    count: sameUnit.length,
    last,
    usualUnitPriceRappen: rappen(median(recent.map((observation) => observation.unitPriceRappen))),
    cheapest,
  };
}

/** «12 % teurer als sonst»: whole percent against the usual price, `null` when hardly different. */
export function differenceFromUsual(price: Rappen, usual: Rappen): number | null {
  if (usual <= 0) {
    return null;
  }
  const percent = Math.round(((price - usual) / usual) * 100);
  return Math.abs(percent) < NOTICEABLE_PERCENT ? null : percent;
}
