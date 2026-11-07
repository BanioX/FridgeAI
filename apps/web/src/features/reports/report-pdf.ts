import { categoryById, formatSwissDate, rappen, type LocalDate, type Report } from '@fridgeai/core';
import type { jsPDF } from 'jspdf';
import { messages } from '../../app/messages.de-CH';
import { CHF_MONEY, type Money } from '../../app/money-format';
import { formatQuantity } from '../../ui/quantity-text';
import {
  bars,
  card,
  columns,
  PDF_COLOR as C,
  pill,
  ring,
  stack,
  write,
  type BarRow,
  type Rgb,
} from './pdf-kit';
import { reportInsights } from './report-insights';

const t = messages.reports.pdf;
const PAGE = { width: 210, height: 297, margin: 16 };
const CONTENT = PAGE.width - 2 * PAGE.margin;
/** Two columns on one grid: 86 + 6 + 86 mm. */
const GUTTER = 6;
const HALF = (CONTENT - GUTTER) / 2;
const FOOTER = PAGE.height - 14;
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const LOCATION_COLOR: Record<'fridge' | 'freezer' | 'pantry' | 'reserve', Rgb> = {
  fridge: C.smaragd,
  freezer: C.smaragdMid,
  pantry: C.smaragdSoft,
  reserve: C.silver,
};

type Amount = (value: number, options?: { currency?: boolean }) => string;
const kg = (grams: number) => `${(grams / 1000).toFixed(1)} kg`;

/**
 * Draws a report as an A4 PDF on the device (ADR-0030). Page 1 is the overview: what was saved
 * (with the rescue rate as a ring), four key figures, «Was auffällt» and the months. Page 2 shows
 * where food and money go, as bar charts, and what to eat now. Then the full inventory as a table.
 * jsPDF and its table plugin load only now.
 */
export async function reportPdf(
  report: Report,
  options: { household: string; period: string; createdOn: LocalDate; money?: Money },
): Promise<Blob> {
  const money = options.money ?? CHF_MONEY;
  const amount: Amount = (value, format) => money.format(rappen(value), format);
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: `rettich – ${t.heading}`,
    subject: options.period,
    creator: 'rettich',
  });

  let y = header(doc, options);
  y = hero(doc, report, y, amount);
  y = keyFigures(doc, report, y + 6, amount);
  y = insights(doc, report, y + 10, money);
  months(doc, report, y + 10, amount);

  doc.addPage();
  y = PAGE.margin + 4;
  y = wasteAndPlaces(doc, report, y, amount);
  y = urgent(doc, report, y + 10);

  // The inventory table stays in one piece when it fits; otherwise it starts on its own page,
  // so no page carries only a few orphaned rows.
  const tableHeight = 15 + report.fridge.items.length * 7.9;
  y = section(doc, t.inventory, y + 10 + tableHeight > FOOTER - 6 ? newPage(doc) : y + 10);
  autoTable(doc, {
    startY: y,
    head: [[t.columns.name, t.columns.amount, t.columns.place, t.columns.until, t.columns.value]],
    body: report.fridge.items.map((item) => [
      item.name,
      formatQuantity(item.quantity, item.unit),
      messages.locations[item.location],
      formatSwissDate(item.expiresOn),
      `${amount(item.valueRappen)}${item.valueEstimated ? ' *' : ''}`,
    ]),
    margin: { left: PAGE.margin, right: PAGE.margin, bottom: PAGE.height - FOOTER + 6 },
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: [...C.ink],
      cellPadding: { top: 2.2, bottom: 2.2, left: 0, right: 2 },
      lineColor: [...C.line],
    },
    headStyles: { fontSize: 7.5, fontStyle: 'bold', textColor: [...C.muted] },
    // A hairline under every row instead of stripes; the value column ends on the right edge.
    didParseCell: (data) => {
      data.cell.styles.lineWidth = { bottom: data.section === 'head' ? 0.3 : 0.15 };
      if (data.column.index === 4) {
        data.cell.styles.halign = 'right';
        data.cell.styles.cellPadding = { top: 2.2, bottom: 2.2, left: 2, right: 0 };
      }
    },
  });
  y = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y;
  if (report.fridge.valueEstimated || report.impact.estimated) {
    write(doc, t.estimated, PAGE.margin, y + 6, { size: 7.5, color: C.muted });
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.2);
    doc.line(PAGE.margin, FOOTER, PAGE.margin + CONTENT, FOOTER);
    const style = { size: 7.5, color: C.muted };
    write(doc, t.footer, PAGE.margin, FOOTER + 5, style);
    write(doc, t.page(page, pages), PAGE.margin + CONTENT, FOOTER + 5, {
      ...style,
      align: 'right',
    });
  }
  return doc.output('blob');
}

function newPage(doc: jsPDF): number {
  doc.addPage();
  return PAGE.margin + 4;
}

/** A section title on the grid; returns where its content starts. */
function section(doc: jsPDF, title: string, y: number, right?: () => void): number {
  write(doc, title, PAGE.margin, y, { size: 12, color: C.ink, bold: true });
  right?.();
  return y + 5;
}

/** Logo mark and «rettich» on the left, report and household on the right, both 9 mm high. */
function header(
  doc: jsPDF,
  options: { household: string; period: string; createdOn: LocalDate },
): number {
  const top = PAGE.margin;
  card(doc, PAGE.margin, top, 9, 9, C.smaragd, 2.4);
  write(doc, 'r', PAGE.margin + 4.5, top + 4.6, {
    size: 13,
    color: C.white,
    bold: true,
    align: 'center',
    baseline: 'middle',
  });
  write(doc, 'rettich', PAGE.margin + 12, top + 4.6, {
    size: 16,
    color: C.onyx,
    bold: true,
    baseline: 'middle',
  });
  const right = PAGE.margin + CONTENT;
  write(doc, `${t.heading} · ${options.period}`, right, top + 3.4, {
    size: 10,
    color: C.ink,
    bold: true,
    align: 'right',
  });
  write(doc, t.meta(options.household, formatSwissDate(options.createdOn)), right, top + 8.4, {
    size: 8.5,
    color: C.muted,
    align: 'right',
  });
  return top + 15;
}

/** Onyx card: the money saved, big, and the rescue rate as a ring. */
function hero(doc: jsPDF, report: Report, y: number, amount: Amount): number {
  const height = 46;
  card(doc, PAGE.margin, y, CONTENT, height, C.onyx, 4);
  const left = PAGE.margin + 9;
  write(doc, t.saved, left, y + 12, { size: 9, color: C.smaragdSoft, bold: true });
  write(doc, amount(report.impact.savedRappen), left, y + 26, {
    size: 30,
    color: C.white,
    bold: true,
  });
  write(doc, t.savedDetail(kg(report.impact.savedGrams), report.impact.savedCount), left, y + 35, {
    size: 9,
    color: C.silver,
  });
  const center = { x: PAGE.margin + CONTENT - 27, y: y + height / 2 };
  const share = report.impact.savedShare;
  ring(doc, center, 14, 4.2, share, C.onyxRaised, C.smaragdMid);
  write(
    doc,
    share === null ? '–' : `${String(Math.round(share * 100))} %`,
    center.x,
    center.y - 1.2,
    {
      size: 15,
      color: C.white,
      bold: true,
      align: 'center',
      baseline: 'middle',
    },
  );
  write(doc, t.rateLabel, center.x, center.y + 5.2, {
    size: 7.5,
    color: C.silver,
    align: 'center',
    baseline: 'middle',
  });
  return y + height;
}

/** Four tiles of equal size: label, value and detail on the same lines in every tile. */
function keyFigures(doc: jsPDF, report: Report, y: number, amount: Amount): number {
  const tiles: [string, string, string, Rgb][] = [
    [t.inStock, amount(report.fridge.valueRappen), t.items(report.fridge.itemCount), C.ink],
    [t.wasted, amount(report.impact.wastedRappen), kg(report.impact.wastedGrams), C.today],
    [t.spent, amount(report.shopping.spentRappen), t.receipts(report.shopping.receiptCount), C.ink],
    [t.urgentTile, t.items(report.fridge.urgent.length), t.urgentDetail, C.ink],
  ];
  const gap = 4;
  const width = (CONTENT - gap * (tiles.length - 1)) / tiles.length;
  const height = 24;
  tiles.forEach(([label, value, detail, color], index) => {
    const x = PAGE.margin + index * (width + gap);
    card(doc, x, y, width, height, C.oat);
    write(doc, label, x + 4, y + 7, { size: 7.5, color: C.muted, bold: true }, width - 8);
    write(doc, value, x + 4, y + 15, { size: 13, color, bold: true }, width - 8);
    write(doc, detail, x + 4, y + 20.5, { size: 7.5, color: C.muted }, width - 8);
  });
  return y + height;
}

/** «Was auffällt»: one line per finding, each with a Smaragd dot, in a tinted card. */
function insights(doc: jsPDF, report: Report, y: number, money: Money): number {
  const start = section(doc, t.insights, y);
  const lines = reportInsights(report, money);
  const textWidth = CONTENT - 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const wrapped = lines.map((line) => doc.splitTextToSize(line, textWidth) as string[]);
  const lineHeight = 4.6;
  const gap = 2.4;
  // Same space above the first line and below the last: 6 mm plus the height of the letters.
  const pad = 6;
  const text = wrapped.reduce((sum, rows) => sum + rows.length * lineHeight + gap, -gap);
  const height = 2 * pad + text;
  card(doc, PAGE.margin, start, CONTENT, height, C.smaragdTint);
  let at = start + pad + 3.3;
  for (const rows of wrapped) {
    doc.setFillColor(...C.smaragd);
    doc.circle(PAGE.margin + 7, at - 1.1, 1.1, 'F');
    rows.forEach((row, index) => {
      write(doc, row, PAGE.margin + 11, at + index * lineHeight, { size: 9.5, color: C.ink });
    });
    at += rows.length * lineHeight + gap;
  }
  return start + height;
}

/** Saved and wasted per month as columns, legend on the title line. */
function months(doc: jsPDF, report: Report, y: number, amount: Amount): void {
  const legend: [string, Rgb][] = [
    [t.saved, C.smaragd],
    [t.wasted, C.today],
  ];
  const start = section(doc, t.months, y, () => {
    let right = PAGE.margin + CONTENT;
    for (const [label, color] of [...legend].reverse()) {
      write(doc, label, right, y, { size: 8, color: C.ink, align: 'right' });
      doc.setFillColor(...color);
      doc.circle(right - doc.getTextWidth(label) - 2.6, y - 1.1, 1.2, 'F');
      right -= doc.getTextWidth(label) + 9;
    }
  });
  const height = Math.min(70, FOOTER - 8 - start);
  columns(
    doc,
    { x: PAGE.margin, y: start, width: CONTENT, height },
    report.impact.months.map((month) => ({
      label: MONTHS[Number(month.month.slice(5, 7)) - 1] ?? month.month,
      values: [
        { value: month.savedRappen, color: C.smaragd },
        { value: month.wastedRappen, color: C.today },
      ],
    })),
    (value) => amount(value, { currency: false }),
    // Whole numbers on the axis: «15», not «15.00».
    (value) => amount(value, { currency: false }).replace(/[.,]00$/, ''),
  );
}

/** Two rows of two cards: what is wasted and why, where the value is and where you shop. */
function wasteAndPlaces(doc: jsPDF, report: Report, y: number, amount: Amount): number {
  const inner = HALF - 12;
  const pad = 6;
  const empty = (x: number, top: number, text: string) => {
    write(doc, text, x + pad, top + 18, { size: 9, color: C.muted });
  };

  // Row 1: what lands in the bin, and why.
  const waste: BarRow[] = report.impact.topWasted.slice(0, 5).map((entry) => ({
    label: categoryById(entry.categoryId)?.name.de ?? entry.categoryId,
    value: entry.valueRappen,
    display: amount(entry.valueRappen),
    color: C.today,
  }));
  const reasons: BarRow[] = report.impact.reasons.slice(0, 5).map((entry) => ({
    label: messages.wasteReasons[entry.reason],
    value: entry.count,
    display: `${String(entry.count)}×`,
    color: C.soon,
  }));
  const rowOne = 18 + Math.max(1, waste.length, reasons.length) * 8;
  const left = PAGE.margin;
  const right = PAGE.margin + HALF + GUTTER;
  card(doc, left, y, HALF, rowOne, C.oat);
  card(doc, right, y, HALF, rowOne, C.oat);
  write(doc, t.wasteTop, left + pad, y + 9, { size: 10, color: C.ink, bold: true });
  write(doc, t.reasons, right + pad, y + 9, { size: 10, color: C.ink, bold: true });
  if (waste.length === 0) {
    empty(left, y, t.noWaste);
  } else {
    bars(doc, left + pad, y + 13, inner, waste, { labelWidth: 30, valueWidth: 18, track: C.white });
  }
  if (reasons.length === 0) {
    empty(right, y, t.none);
  } else {
    bars(doc, right + pad, y + 13, inner, reasons, {
      labelWidth: 30,
      valueWidth: 8,
      track: C.white,
    });
  }

  // Row 2: where the value sits, and where the money went.
  const top = y + rowOne + GUTTER;
  const places: BarRow[] = report.fridge.byLocation
    .filter((entry) => entry.itemCount > 0)
    .map((entry) => ({
      label: `${messages.locations[entry.location]} · ${t.items(entry.itemCount)}`,
      value: entry.valueRappen,
      display: amount(entry.valueRappen),
      color: LOCATION_COLOR[entry.location],
    }));
  const shops: BarRow[] = report.shopping.byRetailer.map((entry) => ({
    label: messages.priceMemory.shops[entry.retailer],
    value: entry.spentRappen,
    display: amount(entry.spentRappen),
    color: C.smaragd,
  }));
  const rowTwo = 18 + Math.max(2, places.length + 1, shops.length + 1) * 7.6;
  card(doc, left, top, HALF, rowTwo, C.oat);
  card(doc, right, top, HALF, rowTwo, C.oat);
  write(doc, t.places, left + pad, top + 9, { size: 10, color: C.ink, bold: true });
  write(doc, t.shops, right + pad, top + 9, { size: 10, color: C.ink, bold: true });
  if (places.length === 0) {
    empty(left, top, t.none);
  } else {
    stack(doc, left + pad, top + 14, inner, places);
  }
  if (shops.length === 0) {
    empty(right, top, t.none);
  } else {
    const used = bars(doc, right + pad, top + 13, inner, shops, {
      labelWidth: 22,
      valueWidth: 20,
      track: C.white,
    });
    const total = top + 13 + used + 4;
    write(doc, t.total, right + pad, total, { size: 8.5, color: C.muted, bold: true });
    write(doc, amount(report.shopping.spentRappen), right + pad + inner, total, {
      size: 8.5,
      color: C.ink,
      bold: true,
      align: 'right',
    });
  }
  return top + rowTwo;
}

/** «Jetzt essen»: one row per item, the deadline as a coloured pill on the right. */
function urgent(doc: jsPDF, report: Report, y: number): number {
  let start = section(doc, t.urgent, y);
  const items = report.fridge.urgent;
  if (items.length === 0) {
    write(doc, t.noUrgent, PAGE.margin, start + 5, { size: 9, color: C.muted });
    return start + 8;
  }
  const rowHeight = 11;
  for (const item of items) {
    if (start + rowHeight > FOOTER - 6) {
      start = newPage(doc);
    }
    card(doc, PAGE.margin, start, CONTENT, rowHeight - 2, C.oat, 2.5);
    const middle = start + (rowHeight - 2) / 2;
    write(
      doc,
      item.name,
      PAGE.margin + 5,
      middle,
      {
        size: 9.5,
        color: C.ink,
        bold: true,
        baseline: 'middle',
      },
      70,
    );
    write(
      doc,
      `${formatQuantity(item.quantity, item.unit)} · ${messages.locations[item.location]}`,
      PAGE.margin + 80,
      middle,
      { size: 8.5, color: C.muted, baseline: 'middle' },
      55,
    );
    const late = item.daysLeft <= 0;
    pill(doc, t.due(item.daysLeft), PAGE.margin + CONTENT - 5, middle, {
      text: late ? C.today : C.soon,
      fill: late ? C.todayTint : C.soonTint,
    });
    start += rowHeight;
  }
  return start;
}
