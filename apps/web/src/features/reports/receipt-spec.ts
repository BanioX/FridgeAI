import {
  daysBetween,
  expiryStatus,
  formatSwissDate,
  rappen,
  type FootprintSummary,
  type Report,
  type ReportItem,
  type StorageLocation,
} from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';
import type { Money } from '../../app/money-format';
import { expiryBadge } from '../../ui/expiry-badge';
import { ringShare } from '../../ui/ring-share';
import { formatQuantity } from '../../ui/quantity-text';
import {
  co2e,
  estimatedPercent,
  food,
  formatNumber,
  land,
  pdfSafe,
  text,
  water,
  type Quantity,
} from '../climate/climate-format';

/** The short reports, each a receipt (Alban, 8.11.2026); «full» is the detailed report. */
export type QuickKind = 'impact' | 'expiring' | 'wasted' | 'fridge' | 'freezer' | 'pantry';
export type ReportKind = QuickKind | 'full';
export const REPORT_KINDS: readonly ReportKind[] = [
  'impact',
  'expiring',
  'wasted',
  'fridge',
  'freezer',
  'pantry',
  'full',
];

/** Which kinds look back over a period, and which only look at today. */
export const usesPeriod = (kind: ReportKind) =>
  kind === 'impact' || kind === 'wasted' || kind === 'full';

const PLACES: Record<'fridge' | 'freezer' | 'pantry', StorageLocation> = {
  fridge: 'fridge',
  freezer: 'freezer',
  pantry: 'pantry',
};

/** One line of a receipt: label left, value right, an optional grey note below. */
export interface ReceiptPost {
  label: string;
  value: string;
  note?: string;
  /** Smaragd for what was saved, red for what is lost or at risk. */
  tint?: 'saved' | 'lost';
  bold?: boolean;
  /** The last, large line («TOTAL …»). */
  big?: boolean;
}

/** What a receipt shows, independent of how it is drawn. */
export interface ReceiptSpec {
  title: string;
  /** Groups of posts, separated by a dashed rule. */
  sections: ReceiptPost[][];
  totals: ReceiptPost[];
  /** Shown instead of the posts when there are none. */
  empty?: string;
  /** Two rings above the posts: «Verwertet» and «Entsorgt» (ADR-0046), share 0–1. */
  rings?: { used: ReceiptRing; wasted: ReceiptRing };
  /**
   * Posts after the totals, kept together on one piece of paper (the «Klimabilanz» of the Bilanz):
   * the money part stays complete, the climate block follows whole on the next page if needed.
   */
  after?: ReceiptPost[];
  /** A small source line above the thank-you (the CC BY 4.0 attribution of the Klimabilanz). */
  source?: string;
}

export interface ReceiptRing {
  label: string;
  share: number;
  value: string;
}

const t = messages.reports.pdf.receipt;
const kg = (grams: number) => `${(grams / 1000).toFixed(1)} kg`;

/** The «Klimabilanz» block of the Bilanz receipt (ADR-0057); nothing when nothing was rescued. */
function climatePosts(footprint: FootprintSummary | undefined, money: Money): ReceiptPost[] {
  if (footprint === undefined || footprint.rescued.count === 0) {
    return [];
  }
  const { rescued, kehricht } = footprint;
  const metric = (label: string, quantity: Quantity): ReceiptPost => ({
    label: pdfSafe(label.toUpperCase()),
    value: pdfSafe(text(quantity)),
    tint: 'saved',
  });
  const percent = estimatedPercent(rescued.estimatedShare);
  const m = messages.climate.metrics;
  return [
    {
      label: t.climate,
      value: '',
      bold: true,
      ...(percent === null ? {} : { note: t.climateEstimated(percent) }),
    },
    metric(m.food, food(rescued.grams)),
    metric(m.co2e, co2e(rescued.co2eGrams)),
    metric(m.water, water(rescued.waterLitres)),
    metric(m.land, land(rescued.landM2)),
    ...(kehricht === null
      ? []
      : [
          {
            label: t.kehricht,
            value: t.kehrichtValue(money.format(kehricht.feeRappen)),
            note: t.kehrichtBags(formatNumber(kehricht.bags, 1)),
          },
        ]),
  ];
}

/**
 * The posts of a short report. Pure: the same report gives the same receipt, so it is tested
 * without drawing. `days` is how far «Läuft bald ab» looks ahead.
 */
export function receiptSpec(
  report: Report,
  kind: QuickKind,
  options: { money: Money; days: number; footprint?: FootprintSummary },
): ReceiptSpec {
  const amount = (value: number) => options.money.format(rappen(value));
  const itemValue = (item: ReportItem) =>
    `${amount(item.valueRappen)}${item.valueEstimated ? ' *' : ''}`;
  const badge = (item: ReportItem) =>
    expiryBadge(
      expiryStatus(item.expiresOn, report.today, item.expiryKind ?? 'best_before'),
      item.expiresOn,
      report.today,
      item.location,
    ).label;
  const total = (items: readonly { valueRappen: number }[]) =>
    items.reduce((sum, item) => sum + item.valueRappen, 0);
  const items = messages.reports.pdf.items;

  switch (kind) {
    case 'impact': {
      const impact = report.impact;
      const share = impact.savedShare;
      const used = { rappen: impact.usedRappen, count: impact.usedCount };
      const wasted = { rappen: impact.wastedRappen, count: impact.wastedCount };
      const climate = climatePosts(options.footprint, options.money);
      return {
        title: t.title,
        ...(used.count + wasted.count === 0
          ? {}
          : {
              rings: {
                used: {
                  label: t.used,
                  share: ringShare(used, wasted),
                  value: amount(impact.usedRappen),
                },
                wasted: {
                  label: t.wasted,
                  share: ringShare(wasted, used),
                  value: amount(impact.wastedRappen),
                },
              },
            }),
        sections: [
          [
            {
              label: t.saved,
              value: amount(impact.savedRappen),
              note: t.detail(impact.savedCount, kg(impact.savedGrams)),
              tint: 'saved',
              bold: true,
            },
            {
              label: t.wasted,
              value: amount(impact.wastedRappen),
              note: t.detail(impact.wastedCount, kg(impact.wastedGrams)),
              tint: 'lost',
              bold: true,
            },
          ],
          [
            {
              label: t.inStock,
              value: amount(report.fridge.valueRappen),
              note: items(report.fridge.itemCount),
            },
            {
              label: t.spent,
              value: amount(report.shopping.spentRappen),
              note: messages.reports.pdf.receipts(report.shopping.receiptCount),
            },
          ],
        ],
        ...(climate.length === 0 ? {} : { after: climate, source: t.climateSource }),
        totals: [
          {
            label: t.rate,
            value: share === null ? '–' : `${String(Math.round(share * 100))} %`,
            bold: true,
          },
          { label: t.total, value: amount(impact.savedRappen), tint: 'saved', big: true },
        ],
      };
    }
    case 'expiring': {
      const soon = report.fridge.items.filter(
        (item) => daysBetween(report.today, item.expiresOn) <= options.days,
      );
      return {
        title: t.expiringTitle(options.days),
        sections:
          soon.length === 0
            ? []
            : [
                soon.map((item) => ({
                  label: item.name,
                  value: itemValue(item),
                  note: `${badge(item)} · ${messages.locations[item.location]}`,
                })),
              ],
        totals: [
          { label: t.count, value: String(soon.length), bold: true },
          { label: t.expiringTotal, value: amount(total(soon)), tint: 'lost', big: true },
        ],
        ...(soon.length === 0 ? { empty: t.expiringEmpty } : {}),
      };
    }
    case 'wasted': {
      const wasted = report.impact.wastedItems;
      const grams = wasted.reduce((sum, item) => sum + (item.grams ?? 0), 0);
      return {
        title: t.wastedTitle,
        sections:
          wasted.length === 0
            ? []
            : [
                wasted.map((item) => ({
                  label: item.name,
                  value: amount(item.valueRappen),
                  note: [
                    formatSwissDate(item.on),
                    ...(item.reason === undefined ? [] : [messages.wasteReasons[item.reason]]),
                  ].join(' · '),
                })),
              ],
        totals: [
          { label: t.count, value: String(wasted.length), bold: true },
          ...(grams > 0 ? [{ label: t.weight, value: kg(grams), bold: true }] : []),
          { label: t.wastedTotal, value: amount(total(wasted)), tint: 'lost', big: true },
        ],
        ...(wasted.length === 0 ? { empty: t.wastedEmpty } : {}),
      };
    }
    case 'fridge':
    case 'freezer':
    case 'pantry': {
      const place = messages.locations[PLACES[kind]];
      const here = report.fridge.items.filter((item) => item.location === PLACES[kind]);
      return {
        title: t.placeTitle(place),
        sections:
          here.length === 0
            ? []
            : [
                here.map((item) => ({
                  label: item.name,
                  value: itemValue(item),
                  note: [
                    formatQuantity(item.quantity, item.unit),
                    ...(item.spot === undefined ? [] : [item.spot]),
                    badge(item),
                    ...(item.ownerInitials === undefined ? [] : [item.ownerInitials]),
                  ].join(' · '),
                })),
              ],
        totals: [
          { label: t.count, value: String(here.length), bold: true },
          { label: t.placeTotal, value: amount(total(here)), tint: 'saved', big: true },
        ],
        ...(here.length === 0 ? { empty: t.placeEmpty } : {}),
      };
    }
  }
}
