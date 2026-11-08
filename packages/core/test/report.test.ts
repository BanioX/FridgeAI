import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { IsoDateTimeSchema } from '../src/model/primitives';
import { rappen } from '../src/money';
import { buildReport, type ReportItem, type ReportOutcome } from '../src/reports/report';

const today = localDate('2026-11-07');
const item = (
  name: string,
  expiresOn: string,
  value: number,
  location: ReportItem['location'] = 'fridge',
): ReportItem => ({
  name,
  categoryId: 'dairy-yoghurt',
  location,
  quantity: 1,
  unit: 'pcs',
  expiresOn: localDate(expiresOn),
  valueRappen: rappen(value),
  valueEstimated: false,
});
const closed = (
  outcome: ReportOutcome['outcome'],
  at: string,
  value: number,
  categoryId = 'bakery-bread',
  extra: Partial<ReportOutcome> = {},
): ReportOutcome => ({
  outcome,
  at: IsoDateTimeSchema.parse(at),
  valueRappen: rappen(value),
  valueEstimated: false,
  grams: 100,
  atRisk: true,
  categoryId,
  ...extra,
});

describe('buildReport (ADR-0030)', () => {
  const report = buildReport({
    today,
    from: localDate('2026-09-01'),
    to: today,
    items: [
      item('Skyr', '2026-11-08', 185),
      item('Milch', '2026-11-05', 125),
      item('Reis', '2027-06-01', 290, 'pantry'),
    ],
    outcomes: [
      closed('eaten', '2026-09-10T10:00:00.000Z', 400),
      closed('wasted', '2026-10-02T10:00:00.000Z', 300, 'bakery-bread', {
        wasteReason: 'forgotten',
      }),
      closed('wasted', '2026-10-20T10:00:00.000Z', 250, 'bakery-bread', {
        wasteReason: 'forgotten',
      }),
      closed('wasted', '2026-11-03T10:00:00.000Z', 600, 'meat-poultry', { wasteReason: 'spoiled' }),
      closed('shared_out', '2026-11-04T10:00:00.000Z', 500),
      closed('wasted', '2026-11-05T10:00:00.000Z', 999, 'meat-poultry', {
        deletedAt: IsoDateTimeSchema.parse('2026-11-05T11:00:00.000Z'),
      }),
      closed('eaten', '2026-08-30T10:00:00.000Z', 700),
    ],
    purchases: [
      { retailer: 'coop', purchasedOn: localDate('2026-11-05'), totalRappen: rappen(4155) },
      { retailer: 'migros', purchasedOn: localDate('2026-10-21'), totalRappen: rappen(1430) },
      { retailer: 'coop', purchasedOn: localDate('2026-10-01'), totalRappen: rappen(2000) },
      { retailer: 'lidl', purchasedOn: localDate('2026-08-29'), totalRappen: rappen(10980) },
    ],
  });

  it('shows the fridge now: value per place and what is urgent, most urgent first', () => {
    expect(report.fridge).toMatchObject({ itemCount: 3, valueRappen: 600, valueEstimated: false });
    expect(report.fridge.byLocation.map((l) => [l.location, l.itemCount, l.valueRappen])).toEqual([
      ['fridge', 2, 310],
      ['freezer', 0, 0],
      ['pantry', 1, 290],
      ['reserve', 0, 0],
    ]);
    expect(report.fridge.urgent.map((i) => [i.name, i.daysLeft])).toEqual([
      ['Milch', -2],
      ['Skyr', 1],
    ]);
  });

  it('sums rescued and wasted per month in the period, without undone outcomes', () => {
    expect(report.impact).toMatchObject({
      savedRappen: 900,
      wastedRappen: 1150,
      savedCount: 2,
    });
    const fresh = buildReport({
      today: localDate('2026-11-07'),
      from: localDate('2026-11-01'),
      to: localDate('2026-11-30'),
      items: [],
      outcomes: [
        closed('eaten', '2026-11-02T12:00:00.000Z', 300, 'bakery-bread', { atRisk: false }),
      ],
      purchases: [],
    });
    // Eaten while fresh is consumption, not a rescue.
    expect(fresh.impact).toMatchObject({ savedRappen: 0, savedCount: 0, savedShare: null });
    expect(report.impact.months).toEqual([
      { month: '2026-09', savedRappen: 400, wastedRappen: 0 },
      { month: '2026-10', savedRappen: 0, wastedRappen: 550 },
      { month: '2026-11', savedRappen: 500, wastedRappen: 600 },
    ]);
  });

  it('shows what of the saved was given away, only when it was at risk', () => {
    expect(report.impact).toMatchObject({ sharedRappen: 500, sharedCount: 1 });
    const fresh = buildReport({
      today: localDate('2026-11-07'),
      from: localDate('2026-11-01'),
      to: localDate('2026-11-30'),
      items: [],
      outcomes: [
        closed('shared_out', '2026-11-02T12:00:00.000Z', 300, 'bakery-bread', { atRisk: false }),
      ],
      purchases: [],
    });
    // Giving away fresh food is generous, but not a rescue (ADR-0033).
    expect(fresh.impact).toMatchObject({ sharedRappen: 0, sharedCount: 0 });
  });

  it('lists what was thrown away, newest first, with name, day, value and reason', () => {
    expect(
      report.impact.wastedItems.map((entry) => [entry.on, entry.valueRappen, entry.reason]),
    ).toEqual([
      ['2026-11-03', 600, 'spoiled'],
      ['2026-10-20', 250, 'forgotten'],
      ['2026-10-02', 300, 'forgotten'],
    ]);
  });

  it('names what is wasted most and why', () => {
    expect(report.impact.topWasted).toEqual([
      { categoryId: 'meat-poultry', count: 1, valueRappen: 600 },
      { categoryId: 'bakery-bread', count: 2, valueRappen: 550 },
    ]);
    expect(report.impact.reasons).toEqual([
      { reason: 'forgotten', count: 2 },
      { reason: 'spoiled', count: 1 },
    ]);
  });

  it('adds up the receipts of the period per shop', () => {
    expect(report.shopping).toEqual({
      receiptCount: 3,
      spentRappen: 7585,
      byRetailer: [
        { retailer: 'coop', receiptCount: 2, spentRappen: 6155 },
        { retailer: 'migros', receiptCount: 1, spentRappen: 1430 },
      ],
    });
  });

  it('keeps at most the last twelve months and works without any data', () => {
    const empty = buildReport({
      today,
      from: localDate('2024-01-01'),
      to: today,
      items: [],
      outcomes: [],
      purchases: [],
    });
    expect(empty.impact.months).toHaveLength(12);
    expect(empty.impact.months.at(-1)?.month).toBe('2026-11');
    expect(empty.fridge.urgent).toEqual([]);
    expect(empty.impact.savedShare).toBeNull();
  });
});
