import {
  buildReport,
  IsoDateTimeSchema,
  localDate,
  rappen,
  uuidV7,
  type FootprintSummary,
  type Report,
  type ReportItem,
  type ReportOutcome,
  type ReportPurchase,
} from '@fridgeai/core';

/**
 * A full, invented half year of a WG (no real data): enough for every chart and table.
 * Used by `report-pdf.test.ts` and to preview the PDF in a browser; never shipped in the app.
 */
export function sampleReport(): Report {
  const item = (
    name: string,
    categoryId: string,
    location: ReportItem['location'],
    quantity: number,
    unit: ReportItem['unit'],
    expiresOn: string,
    value: number,
    valueEstimated = false,
    retailer?: ReportItem['retailer'],
    extra: Partial<ReportItem> = {},
  ): ReportItem => ({
    name,
    categoryId,
    location,
    quantity,
    unit,
    expiresOn: localDate(expiresOn),
    valueRappen: rappen(value),
    valueEstimated,
    ...(retailer === undefined ? {} : { retailer }),
    ...extra,
  });
  const items: ReportItem[] = [
    {
      ...item('Hackfleisch', 'meat-minced', 'fridge', 300, 'g', '2026-11-05', 890),
      expiryKind: 'use_by',
    },
    {
      ...item('Poulet Brust', 'meat-poultry', 'fridge', 400, 'g', '2026-11-07', 1190),
      expiryKind: 'use_by',
    },
    item('Joghurt Erdbeer', 'dairy-yoghurt', 'fridge', 3, 'pcs', '2026-11-08', 210, false, 'coop', {
      spot: 'Türfach',
      ownerInitials: 'MK',
    }),
    item('Nüsslisalat', 'produce-salad', 'fridge', 100, 'g', '2026-11-09', 350),
    item('Vollmilch', 'dairy-milk', 'fridge', 1000, 'ml', '2026-11-12', 165, false, 'migros'),
    item('Gruyère', 'dairy-cheese-hard', 'fridge', 250, 'g', '2026-12-02', 640, false, 'denner'),
    item('Rüebli', 'produce-carrots', 'fridge', 1000, 'g', '2026-11-20', 220, true),
    item(
      'Schokoladenkuchen',
      'bakery-homemade',
      'fridge',
      1,
      'pcs',
      '2026-11-11',
      760,
      true,
      undefined,
      {
        origin: 'made',
        ownerInitials: 'EB',
      },
    ),
    item(
      'Lasagne',
      'prepared-ready-meals',
      'fridge',
      2,
      'pcs',
      '2026-11-10',
      480,
      true,
      undefined,
      {
        origin: 'leftover',
        spot: 'Mittleres Fach',
      },
    ),
    item('Glace Vanille', 'frozen-icecream', 'freezer', 6, 'pcs', '2027-05-01', 690),
    item('Erbsen', 'frozen-vegetables', 'freezer', 750, 'g', '2027-08-01', 395),
    item('Spaghetti', 'pantry-pasta', 'pantry', 500, 'g', '2027-09-01', 180, true),
    item('Basmati-Reis', 'pantry-rice', 'pantry', 1000, 'g', '2027-10-01', 390),
    item('Wasser', 'reserve-water', 'reserve', 9000, 'ml', '2028-01-01', 540),
  ];
  const outcome = (
    day: string,
    kind: ReportOutcome['outcome'],
    categoryId: string,
    value: number,
    grams: number,
    extra: Partial<ReportOutcome> = {},
  ): ReportOutcome => ({
    outcome: kind,
    categoryId,
    valueRappen: rappen(value),
    grams,
    valueEstimated: false,
    at: IsoDateTimeSchema.parse(`${day}T18:00:00.000Z`),
    atRisk: kind !== 'wasted',
    ...(kind === 'wasted' ? {} : { rescued: true }),
    ...extra,
  });
  const outcomes = [
    outcome('2026-06-10', 'eaten', 'dairy-yoghurt', 280, 600),
    outcome('2026-06-18', 'wasted', 'produce-salad', 350, 100, {
      name: 'Nüsslisalat',
      wasteReason: 'spoiled',
    }),
    outcome('2026-07-03', 'eaten', 'meat-poultry', 1190, 400),
    outcome('2026-07-22', 'wasted', 'bakery-bread', 420, 500, {
      name: 'Ruchbrot',
      wasteReason: 'forgotten',
    }),
    outcome('2026-08-05', 'eaten', 'dairy-cheese-hard', 640, 250),
    outcome('2026-08-19', 'shared_out', 'produce-berries', 450, 250),
    outcome('2026-08-28', 'wasted', 'produce-salad', 350, 100, {
      name: 'Kopfsalat',
      wasteReason: 'forgotten',
    }),
    outcome('2026-09-11', 'eaten', 'meat-minced', 890, 500),
    outcome('2026-09-25', 'wasted', 'dairy-cream', 245, 200, {
      name: 'Vollrahm',
      wasteReason: 'too_much',
    }),
    outcome('2026-10-02', 'eaten', 'produce-tomatoes', 380, 500),
    outcome('2026-10-14', 'eaten', 'dairy-milk', 165, 1000),
    outcome('2026-10-21', 'wasted', 'produce-salad', 350, 100, {
      name: 'Rucola',
      wasteReason: 'expired',
    }),
    outcome('2026-11-03', 'eaten', 'fish-smoked-salmon', 790, 200),
    outcome('2026-11-05', 'eaten', 'bakery-bread', 420, 500),
    // The cake's ingredients: their value moved on to the cake (ADR-0052).
    ...[
      ['2026-11-02', 'pantry-flour', 140],
      ['2026-11-02', 'dairy-butter', 230],
      ['2026-11-02', 'dairy-eggs', 190],
    ].map(([day, category, value]) =>
      outcome(String(day), 'eaten', String(category), Number(value), 200, {
        madeInto: uuidV7(1_762_500_000_000, new Uint8Array(10)),
      }),
    ),
  ];
  const purchase = (retailer: ReportPurchase['retailer'], day: string, total: number) => ({
    retailer,
    purchasedOn: localDate(day),
    totalRappen: rappen(total),
  });
  const purchases = [
    purchase('migros', '2026-06-08', 6430),
    purchase('coop', '2026-06-21', 3815),
    purchase('migros', '2026-07-12', 8120),
    purchase('denner', '2026-08-02', 2290),
    purchase('migros', '2026-08-30', 5575),
    purchase('coop', '2026-09-19', 4460),
    purchase('lidl', '2026-10-09', 3105),
    purchase('migros', '2026-10-24', 7230),
    purchase('coop', '2026-11-04', 2985),
  ];
  return buildReport({
    today: localDate('2026-11-07'),
    from: localDate('2026-06-01'),
    to: localDate('2026-11-07'),
    items,
    outcomes,
    purchases,
  });
}

/** An invented Klimabilanz to go with `sampleReport()` (ADR-0057); no real data. */
export function sampleFootprint(): FootprintSummary {
  return {
    rescued: {
      count: 14,
      grams: 6400,
      co2eGrams: 21800,
      waterLitres: 2650,
      landM2: 24.3,
      estimatedShare: 0.35,
    },
    wasted: {
      count: 4,
      grams: 1250,
      co2eGrams: 3100,
      waterLitres: 480,
      landM2: 3.2,
      estimatedShare: 0.2,
    },
    topCategories: [
      { categoryId: 'meat-poultry', grams: 1200, co2eGrams: 9200 },
      { categoryId: 'dairy-cheese-hard', grams: 750, co2eGrams: 6100 },
      { categoryId: 'dairy-milk', grams: 3000, co2eGrams: 4800 },
    ],
    kehricht: { bags: 1.3, feeRappen: rappen(208) },
  };
}
