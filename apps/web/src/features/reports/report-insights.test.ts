import { localDate, rappen, type Report } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { reportInsights } from './report-insights';

const empty: Report = {
  today: localDate('2026-11-07'),
  from: localDate('2026-11-01'),
  to: localDate('2026-11-07'),
  fridge: {
    itemCount: 0,
    valueRappen: rappen(0),
    valueEstimated: false,
    byLocation: [],
    urgent: [],
    items: [],
  },
  impact: {
    savedRappen: rappen(0),
    wastedRappen: rappen(0),
    savedGrams: 0,
    wastedGrams: 0,
    savedCount: 0,
    wastedCount: 0,
    estimated: false,
    savedShare: null,
    usedRappen: rappen(0),
    usedCount: 0,
    sharedRappen: rappen(0),
    sharedCount: 0,
    wastedItems: [],
    months: [],
    topWasted: [],
    reasons: [],
  },
  shopping: { receiptCount: 0, spentRappen: rappen(0), byRetailer: [] },
};

describe('reportInsights (ADR-0030)', () => {
  it('says what stands out: rate, top waste with a tip, urgent items, the main shop', () => {
    const lines = reportInsights({
      ...empty,
      fridge: {
        ...empty.fridge,
        urgent: [
          {
            name: 'Skyr',
            categoryId: 'dairy-yoghurt',
            location: 'fridge',
            quantity: 1,
            unit: 'pcs',
            expiresOn: localDate('2026-11-08'),
            valueRappen: rappen(185),
            valueEstimated: false,
            daysLeft: 1,
          },
        ],
      },
      impact: {
        ...empty.impact,
        savedShare: 0.62,
        topWasted: [{ categoryId: 'bakery-bread', count: 2, valueRappen: rappen(550) }],
        reasons: [{ reason: 'forgotten', count: 2 }],
      },
      shopping: {
        receiptCount: 2,
        spentRappen: rappen(6155),
        byRetailer: [{ retailer: 'coop', receiptCount: 2, spentRappen: rappen(6155) }],
      },
    });
    expect(lines).toEqual([
      'Du hast 62 % gerettet. Da geht noch etwas.',
      'Am meisten entsorgt: Brot (2×, CHF 5.50).',
      'Häufigster Grund: vergessen. Tipp: Der Kühlschrank-Check auf «Heute» erinnert dich jede Woche.',
      '1 Artikel ist abgelaufen oder läuft in 3 Tagen ab.',
      'Am meisten ausgegeben bei Coop: CHF 61.55.',
    ]);
  });

  it('praises a high rate and stays honest without data', () => {
    expect(reportInsights({ ...empty, impact: { ...empty.impact, savedShare: 0.9 } })[0]).toMatch(
      /^Stark: Du hast 90 %/,
    );
    expect(reportInsights({ ...empty, impact: { ...empty.impact, savedShare: 0.3 } })[0]).toMatch(
      /^Nur 30 % gerettet/,
    );
    expect(reportInsights(empty)).toEqual([
      'Noch wenig Daten. Mit jeder Quittung und jedem Abschluss wird der Bericht genauer.',
    ]);
  });
});
