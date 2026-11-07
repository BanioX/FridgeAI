import {
  categoryById,
  formatChf,
  formatSwissDate,
  type LocalDate,
  type Report,
} from '@fridgeai/core';
import type { jsPDF } from 'jspdf';
import { messages } from '../../app/messages.de-CH';
import { formatQuantity } from '../../ui/quantity-text';
import { reportInsights } from './report-insights';

export type ReportKind = 'all' | 'fridge' | 'impact' | 'shopping';

const t = messages.reports.pdf;
const PAGE = { width: 210, height: 297, margin: 16 };
const CONTENT = PAGE.width - 2 * PAGE.margin;
type Rgb = [number, number, number];
const COLOR: Record<'basil' | 'basilLight' | 'ink' | 'muted' | 'line' | 'today', Rgb> = {
  basil: [44, 113, 73],
  basilLight: [239, 250, 228],
  ink: [28, 33, 30],
  muted: [100, 108, 103],
  line: [217, 228, 212],
  today: [176, 58, 46],
};
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

const chf = (rappen: number) => formatChf(rappen as Parameters<typeof formatChf>[0]);
const kg = (grams: number) => `${(grams / 1000).toFixed(1)} kg`;

/**
 * Draws a report as an A4 PDF on the device (ADR-0030): header, key figures, «Was auffällt», a bar
 * chart per month and tables, in the colours of the app. jsPDF and its table plugin load only now.
 */
export async function reportPdf(
  report: Report,
  options: { kind: ReportKind; household: string; period: string; createdOn: LocalDate },
): Promise<Blob> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const kindName = messages.reports.kinds[options.kind];
  doc.setProperties({
    title: `Rettich – ${kindName}`,
    subject: options.period,
    creator: 'Rettich',
  });
  let y = PAGE.margin;

  const text = (value: string, x: number, at: number, size: number, color: Rgb, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(value, x, at);
  };
  const room = (needed: number) => {
    if (y + needed > PAGE.height - PAGE.margin) {
      doc.addPage();
      y = PAGE.margin;
    }
  };
  const heading = (value: string) => {
    room(16);
    y += 4;
    text(value, PAGE.margin, y, 13, COLOR.ink, true);
    y += 6;
  };
  const table = (head: string[], body: string[][], alignRight: number[] = []) => {
    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      margin: { left: PAGE.margin, right: PAGE.margin },
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9, textColor: COLOR.ink, cellPadding: 1.8 },
      headStyles: { fillColor: COLOR.basil, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLOR.basilLight },
      columnStyles: Object.fromEntries(alignRight.map((index) => [index, { halign: 'right' }])),
      // Column titles over numbers stand right too; a «Total» row is bold.
      didParseCell: (data) => {
        if (alignRight.includes(data.column.index)) {
          data.cell.styles.halign = 'right';
        }
        if (
          data.section === 'body' &&
          data.row.raw instanceof Array &&
          data.row.raw[0] === t.total
        ) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 6;
  };

  // Header band.
  doc.setFillColor(...COLOR.basil);
  doc.rect(0, 0, PAGE.width, 30, 'F');
  text(t.heading(kindName), PAGE.margin, 15, 18, [255, 255, 255], true);
  text(
    t.subtitle(options.household, options.period, formatSwissDate(options.createdOn)),
    PAGE.margin,
    23,
    10,
    [220, 238, 226],
  );
  y = 40;

  if (options.kind !== 'shopping') {
    keyFigures(doc, report, y, text);
    y += 30;
  }
  if (options.kind === 'all' || options.kind === 'impact') {
    heading(t.insights);
    for (const line of reportInsights(report)) {
      const wrapped = doc.splitTextToSize(`•  ${line}`, CONTENT) as string[];
      room(wrapped.length * 5 + 1);
      text(wrapped.join('\n'), PAGE.margin, y, 10, COLOR.ink);
      y += wrapped.length * 5 + 1;
    }
    heading(t.months);
    room(60);
    monthChart(doc, report, y, text);
    y += 58;
    heading(t.wasteTop);
    if (report.impact.topWasted.length === 0) {
      text(t.none, PAGE.margin, y, 10, COLOR.muted);
      y += 8;
    } else {
      table(
        [t.columns.category, t.columns.count, t.columns.value],
        report.impact.topWasted.map((entry) => [
          categoryById(entry.categoryId)?.name.de ?? entry.categoryId,
          `${String(entry.count)}×`,
          chf(entry.valueRappen),
        ]),
        [1, 2],
      );
      table(
        [t.columns.reason, t.columns.count],
        report.impact.reasons.map((entry) => [
          messages.wasteReasons[entry.reason],
          `${String(entry.count)}×`,
        ]),
        [1],
      );
    }
  }
  if (options.kind === 'all' || options.kind === 'fridge') {
    heading(t.urgent);
    if (report.fridge.urgent.length === 0) {
      text(t.none, PAGE.margin, y, 10, COLOR.muted);
      y += 8;
    } else {
      table(
        [t.columns.name, t.columns.place, t.columns.until, t.columns.days],
        report.fridge.urgent.map((item) => [
          item.name,
          messages.locations[item.location],
          formatSwissDate(item.expiresOn),
          String(item.daysLeft),
        ]),
        [3],
      );
    }
    heading(t.inventory);
    table(
      [t.columns.name, t.columns.amount, t.columns.place, t.columns.until, t.columns.value],
      report.fridge.items.map((item) => [
        item.name,
        formatQuantity(item.quantity, item.unit),
        messages.locations[item.location],
        formatSwissDate(item.expiresOn),
        `${chf(item.valueRappen)}${item.valueEstimated ? ' *' : ''}`,
      ]),
      [4],
    );
  }
  if (options.kind === 'all' || options.kind === 'shopping') {
    heading(t.shopping);
    table(
      [t.columns.shop, t.columns.receipts, t.columns.spent],
      [
        ...report.shopping.byRetailer.map((entry) => [
          messages.priceMemory.shops[entry.retailer],
          String(entry.receiptCount),
          chf(entry.spentRappen),
        ]),
        [t.total, String(report.shopping.receiptCount), chf(report.shopping.spentRappen)],
      ],
      [1, 2],
    );
  }
  if (report.fridge.valueEstimated || report.impact.estimated) {
    room(8);
    text(t.estimated, PAGE.margin, y, 8, COLOR.muted);
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    text(t.footer(page, pages), PAGE.margin, PAGE.height - 8, 8, COLOR.muted);
  }
  return doc.output('blob');
}

type TextFn = (
  value: string,
  x: number,
  at: number,
  size: number,
  color: Rgb,
  bold?: boolean,
) => void;

/** Four tiles: value in stock, saved, wasted, rescue rate. */
function keyFigures(doc: jsPDF, report: Report, y: number, text: TextFn) {
  const share = report.impact.savedShare;
  const tiles: [string, string, string, Rgb][] = [
    [t.inFridge, chf(report.fridge.valueRappen), t.items(report.fridge.itemCount), COLOR.basil],
    [t.saved, chf(report.impact.savedRappen), kg(report.impact.savedGrams), COLOR.basil],
    [t.wasted, chf(report.impact.wastedRappen), kg(report.impact.wastedGrams), COLOR.today],
    [t.rate, share === null ? '–' : `${String(Math.round(share * 100))} %`, '', COLOR.basil],
  ];
  const gap = 4;
  const width = (CONTENT - gap * (tiles.length - 1)) / tiles.length;
  tiles.forEach(([label, value, detail, color], index) => {
    const x = PAGE.margin + index * (width + gap);
    doc.setFillColor(...COLOR.basilLight);
    doc.roundedRect(x, y, width, 24, 3, 3, 'F');
    text(label, x + 4, y + 7, 8, COLOR.muted);
    text(value, x + 4, y + 15, 13, color, true);
    text(detail, x + 4, y + 21, 8, COLOR.muted);
  });
}

/** Saved (green) and wasted (red) bars per month, scaled to the largest value. */
function monthChart(doc: jsPDF, report: Report, y: number, text: TextFn) {
  const months = report.impact.months;
  const height = 40;
  const max = Math.max(1, ...months.flatMap((m) => [m.savedRappen, m.wastedRappen]));
  doc.setDrawColor(...COLOR.line);
  doc.line(PAGE.margin, y + height, PAGE.margin + CONTENT, y + height);
  const slot = CONTENT / Math.max(1, months.length);
  const bar = Math.min(8, slot / 3);
  months.forEach((month, index) => {
    const x = PAGE.margin + index * slot + slot / 2 - bar;
    const bars: [number, Rgb][] = [
      [month.savedRappen, COLOR.basil],
      [month.wastedRappen, COLOR.today],
    ];
    bars.forEach(([value, color], offset) => {
      const h = (value / max) * height;
      if (h > 0) {
        doc.setFillColor(...color);
        doc.rect(x + offset * bar, y + height - h, bar - 0.6, h, 'F');
        text(
          formatChf(value as Parameters<typeof formatChf>[0], { currency: false }),
          x + offset * bar,
          y + height - h - 1.5,
          6,
          color,
        );
      }
    });
    const name = MONTHS[Number(month.month.slice(5, 7)) - 1] ?? month.month;
    text(name, x, y + height + 5, 8, COLOR.muted);
  });
  // Legend: small squares (the standard PDF font has no ■).
  const legend: [string, Rgb][] = [
    [t.saved, COLOR.basil],
    [t.wasted, COLOR.today],
  ];
  legend.forEach(([label, color], index) => {
    const x = PAGE.margin + index * 32;
    doc.setFillColor(...color);
    doc.rect(x, y + height + 8.2, 3, 3, 'F');
    text(label, x + 4.5, y + height + 10.8, 8, COLOR.ink);
  });
}
