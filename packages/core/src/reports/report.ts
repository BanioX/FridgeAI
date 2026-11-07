import { daysBetween, toLocalDate } from '../dates';
import { isRescue, summarizeImpact, type ImpactSummary } from '../metrics';
import { rappen, sumRappen, type Rappen } from '../money';
import type { OutcomeEvent, WasteReason } from '../model/inventory';
import type { DateKind, LocalDate, Retailer, StorageLocation, Unit } from '../model/primitives';

/** An item in the inventory, with its value (receipt price or category estimate). */
export interface ReportItem {
  name: string;
  categoryId: string;
  location: StorageLocation;
  quantity: number;
  unit: Unit;
  expiresOn: LocalDate;
  /** Missing on reports from callers that do not know it; then «mindestens haltbar» is assumed. */
  expiryKind?: DateKind;
  valueRappen: Rappen;
  valueEstimated: boolean;
}

/** A closed item (eaten, shared, thrown away) with the category of its product. */
export type ReportOutcome = Pick<
  OutcomeEvent,
  | 'outcome'
  | 'wasteReason'
  | 'valueRappen'
  | 'grams'
  | 'valueEstimated'
  | 'at'
  | 'deletedAt'
  | 'atRisk'
> & { categoryId: string };

export interface ReportPurchase {
  retailer: Retailer;
  purchasedOn: LocalDate;
  totalRappen: Rappen;
}

export interface Report {
  today: LocalDate;
  from: LocalDate;
  to: LocalDate;
  fridge: {
    itemCount: number;
    valueRappen: Rappen;
    valueEstimated: boolean;
    byLocation: { location: StorageLocation; itemCount: number; valueRappen: Rappen }[];
    /** Expired or due within three days, most urgent first. */
    urgent: (ReportItem & { daysLeft: number })[];
    items: ReportItem[];
  };
  impact: ImpactSummary & {
    months: { month: string; savedRappen: Rappen; wastedRappen: Rappen }[];
    topWasted: { categoryId: string; count: number; valueRappen: Rappen }[];
    reasons: { reason: WasteReason; count: number }[];
  };
  shopping: {
    receiptCount: number;
    spentRappen: Rappen;
    byRetailer: { retailer: Retailer; receiptCount: number; spentRappen: Rappen }[];
  };
}

const URGENT_DAYS = 3;
const MAX_MONTHS = 12;
const LOCATIONS: readonly StorageLocation[] = ['fridge', 'freezer', 'pantry', 'reserve'];

/** «2026-09» … «2026-11»: the months from `from` to `to`, at most the last twelve. */
function monthsBetween(from: LocalDate, to: LocalDate): string[] {
  const months: string[] = [];
  let year = Number(from.slice(0, 4));
  let month = Number(from.slice(5, 7));
  const last = to.slice(0, 7);
  for (let guard = 0; guard < 600; guard += 1) {
    const key = `${String(year)}-${String(month).padStart(2, '0')}`;
    months.push(key);
    if (key >= last) {
      break;
    }
    month = month === 12 ? 1 : month + 1;
    year = month === 1 ? year + 1 : year;
  }
  return months.slice(-MAX_MONTHS);
}

function topBy<K extends string, T>(
  entries: Iterable<[K, T]>,
  score: (value: T) => number,
  limit: number,
) {
  return [...entries]
    .sort((a, b) => score(b[1]) - score(a[1]) || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

/**
 * Everything a report shows (ADR-0030), computed on the device from the household's data: the
 * inventory now, what was saved and wasted in [from, to] and why, and what was spent where.
 * Pure: the same data gives the same report.
 */
export function buildReport(input: {
  today: LocalDate;
  from: LocalDate;
  to: LocalDate;
  items: readonly ReportItem[];
  outcomes: readonly ReportOutcome[];
  purchases: readonly ReportPurchase[];
}): Report {
  const { today, from, to } = input;
  const items = [...input.items].sort(
    (a, b) => a.expiresOn.localeCompare(b.expiresOn) || a.name.localeCompare(b.name, 'de'),
  );
  const urgent = items
    .map((item) => ({ ...item, daysLeft: daysBetween(today, item.expiresOn) }))
    .filter((item) => item.daysLeft <= URGENT_DAYS);

  const active = input.outcomes.filter((outcome) => {
    const day = toLocalDate(outcome.at);
    return outcome.deletedAt === undefined && day >= from && day <= to;
  });
  const months = monthsBetween(from, to).map((month) => {
    const inMonth = active.filter((outcome) => toLocalDate(outcome.at).startsWith(month));
    const sum = (keep: (outcome: (typeof inMonth)[number]) => boolean) =>
      sumRappen(inMonth.filter(keep).map((o) => o.valueRappen));
    return {
      month,
      savedRappen: sum(isRescue),
      wastedRappen: sum((o) => o.outcome === 'wasted'),
    };
  });
  const wasted = active.filter((outcome) => outcome.outcome === 'wasted');
  const byCategory = new Map<string, { count: number; valueRappen: number }>();
  const byReason = new Map<WasteReason, number>();
  for (const outcome of wasted) {
    const entry = byCategory.get(outcome.categoryId) ?? { count: 0, valueRappen: 0 };
    byCategory.set(outcome.categoryId, {
      count: entry.count + 1,
      valueRappen: entry.valueRappen + outcome.valueRappen,
    });
    if (outcome.wasteReason !== undefined) {
      byReason.set(outcome.wasteReason, (byReason.get(outcome.wasteReason) ?? 0) + 1);
    }
  }

  const purchases = input.purchases.filter((p) => p.purchasedOn >= from && p.purchasedOn <= to);
  const byRetailer = new Map<Retailer, { receiptCount: number; spentRappen: number }>();
  for (const purchase of purchases) {
    const entry = byRetailer.get(purchase.retailer) ?? { receiptCount: 0, spentRappen: 0 };
    byRetailer.set(purchase.retailer, {
      receiptCount: entry.receiptCount + 1,
      spentRappen: entry.spentRappen + purchase.totalRappen,
    });
  }

  return {
    today,
    from,
    to,
    fridge: {
      itemCount: items.length,
      valueRappen: sumRappen(items.map((item) => item.valueRappen)),
      valueEstimated: items.some((item) => item.valueEstimated),
      byLocation: LOCATIONS.map((location) => {
        const here = items.filter((item) => item.location === location);
        return {
          location,
          itemCount: here.length,
          valueRappen: sumRappen(here.map((item) => item.valueRappen)),
        };
      }),
      urgent,
      items,
    },
    impact: {
      ...summarizeImpact(input.outcomes, from, to),
      months,
      topWasted: topBy(byCategory, (entry) => entry.valueRappen, 5).map(([categoryId, entry]) => ({
        categoryId,
        count: entry.count,
        valueRappen: rappen(entry.valueRappen),
      })),
      reasons: topBy(byReason, (count) => count, 5).map(([reason, count]) => ({ reason, count })),
    },
    shopping: {
      receiptCount: purchases.length,
      spentRappen: sumRappen(purchases.map((purchase) => purchase.totalRappen)),
      byRetailer: [...byRetailer]
        .sort((a, b) => b[1].spentRappen - a[1].spentRappen)
        .map(([retailer, entry]) => ({
          retailer,
          receiptCount: entry.receiptCount,
          spentRappen: rappen(entry.spentRappen),
        })),
    },
  };
}
