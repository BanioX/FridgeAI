import {
  categoryById,
  expiryStatus,
  fallbackCategory,
  formatSwissDate,
  rappen,
  type LocalDate,
  type Report,
  type ReportItem,
} from '@fridgeai/core';
import type { jsPDF } from 'jspdf';
import { messages } from '../../app/messages.de-CH';
import { CHF_MONEY, type Money } from '../../app/money-format';
import { expiryBadge } from '../../ui/expiry-badge';
import { formatQuantity } from '../../ui/quantity-text';
import type { Tone } from '../../ui/tones';
import {
  barcode,
  bars,
  card,
  chip,
  columns,
  dashed,
  double,
  emoji,
  ground,
  measure,
  PDF_COLOR as C,
  receiptPaper,
  roundedPicture,
  stack,
  write,
  type BarRow,
  type PdfPictures,
  type Rgb,
  type TextStyle,
} from './pdf-kit';
import { reportInsights } from './report-insights';

const t = messages.reports.pdf;
const PAGE = { width: 210, height: 297, margin: 16 };
const CONTENT = PAGE.width - 2 * PAGE.margin;
const GUTTER = 5;
const HALF = (CONTENT - GUTTER) / 2;
const FOOTER = PAGE.height - 14;
const TOP = 22;
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const LOCATION_COLOR: Record<'fridge' | 'freezer' | 'pantry' | 'reserve', Rgb> = {
  fridge: C.smaragd,
  freezer: C.smaragdMid,
  pantry: C.smaragdSoft,
  reserve: C.silver,
};

type Amount = (value: number, options?: { currency?: boolean }) => string;
const kg = (grams: number) => `${(grams / 1000).toFixed(1)} kg`;
const emojiOf = (categoryId: string) => (categoryById(categoryId) ?? fallbackCategory()).emoji;

interface Context {
  doc: jsPDF;
  report: Report;
  amount: Amount;
  pictures: PdfPictures;
}

/**
 * Draws a report as an A4 PDF on the device (ADR-0030), in the design language of the app: the
 * silver ground, white cards with a soft shadow, the large title, the onyx card with the money
 * saved, and lists like «Vorrat» with the food emoji and the same status chips.
 * Page 1: what was saved, three key figures, «Was auffällt», the months.
 * Page 2: what to eat now, what is wasted and why, where the value and the money are.
 * Then everything in stock. jsPDF and the pictures load only now.
 */
export async function reportPdf(
  report: Report,
  options: {
    household: string;
    period: string;
    createdOn: LocalDate;
    money?: Money;
    pictures?: PdfPictures;
  },
): Promise<Blob> {
  const money = options.money ?? CHF_MONEY;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: `rettich – ${t.heading}`,
    subject: options.period,
    creator: 'rettich',
  });
  const ctx: Context = {
    doc,
    report,
    amount: (value, format) => money.format(rappen(value), format),
    pictures: options.pictures ?? {},
  };

  ground(doc);
  receipt(ctx, options);

  let y = details(doc, options, newPage(doc));
  y = insights(ctx, report, money, y + 6);
  y = months(ctx, room(doc, y + 12, 96));
  y = urgent(ctx, room(doc, y + 12, 34));
  y = waste(ctx, y + 12);
  y = places(ctx, y + 12);
  inventory(ctx, y + 12);

  footers(doc);
  return doc.output('blob');
}

function newPage(doc: jsPDF): number {
  doc.addPage();
  ground(doc);
  return TOP;
}

/** A section title like «Läuft bald ab» in the app; returns where its content starts. */
function section(doc: jsPDF, title: string, y: number): number {
  write(doc, title, PAGE.margin, y, { size: 15, color: C.ink, bold: true });
  return y + 5;
}

/** Room for `height` mm on this page, else a new page; returns where to draw. */
function room(doc: jsPDF, y: number, height: number): number {
  return y + height > FOOTER - 6 ? newPage(doc) : y;
}

/**
 * Page 1: the report as a till receipt («So hast du Food Waste reduziert»), on its own so it can
 * be shared alone: what was saved and given away, what was thrown away, the rescue rate and the
 * total, in a typewriter font on torn paper. The paper is as long as its content and stands in
 * the middle of the page: a first pass only measures, the second draws.
 */
function receipt(
  ctx: Context,
  options: { household: string; period: string; createdOn: LocalDate },
): void {
  const width = 98;
  const x = (PAGE.width - width) / 2;
  const height = receiptLines(ctx, options, x, width, 0, false);
  const top = Math.max(TOP, (FOOTER - height) / 2);
  receiptPaper(ctx.doc, { x, y: top, width, height });
  receiptLines(ctx, options, x, width, top, true);
}

/** Lays out the receipt from `top`; draws only when `paint`. Returns the height of the paper. */
function receiptLines(
  { doc, report, amount, pictures }: Context,
  options: { household: string; period: string; createdOn: LocalDate },
  x: number,
  width: number,
  top: number,
  paint: boolean,
): number {
  const r = t.receipt;
  const left = x + 9;
  const right = x + width - 9;
  const center = PAGE.width / 2;
  const mono = (size: number, color: Rgb = C.ink, bold = false): TextStyle => ({
    size,
    color,
    bold,
    font: 'courier',
  });
  const text = (value: string, at: number, y: number, style: TextStyle, room?: number) => {
    if (paint) {
      write(doc, value, at, y, style, room);
    }
  };
  const rule = (kind: 'dashed' | 'double', y: number) => {
    if (paint) {
      (kind === 'dashed' ? dashed : double)(doc, left, right, y);
    }
  };

  let y = top + 12;
  const logo = 15;
  if (paint) {
    if (pictures.logo === undefined) {
      card(doc, { x: center - logo / 2, y, width: logo, height: logo }, C.smaragd, 3.8);
    } else {
      roundedPicture(doc, pictures.logo, { x: center - logo / 2, y, size: logo }, 3.8);
    }
  }
  y += logo + 8;
  text('Rettich', center, y, { size: 19, color: C.onyx, bold: true, align: 'center' });
  y += 5.5;
  text(r.claim, center, y, { ...mono(8.5, C.muted), align: 'center' });
  y += 7;
  rule('dashed', y);
  y += 7;
  text(r.title, center, y, { ...mono(9.5, C.ink, true), align: 'center' });
  y += 6;
  const meta = [options.household, options.period, t.created(formatSwissDate(options.createdOn))];
  for (const line of meta) {
    text(line, center, y, { ...mono(8.5, C.muted), align: 'center' }, right - left);
    y += 4.4;
  }
  y += 2.6;
  rule('dashed', y);
  y += 8;

  const post = (label: string, value: string, color: Rgb = C.ink, bold = false) => {
    text(label, left, y, mono(10, color, bold), right - left - 32);
    text(value, right, y, { ...mono(10, color, bold), align: 'right' });
    y += 4.6;
  };
  const note = (value: string) => {
    text(`  ${value}`, left, y, mono(8.5, C.muted), right - left);
    y += 6;
  };
  const impact = report.impact;
  post(r.saved, amount(impact.savedRappen), C.smaragd, true);
  note(r.detail(impact.savedCount, kg(impact.savedGrams)));
  post(r.shared, amount(impact.sharedRappen));
  note(r.sharedDetail(impact.sharedCount));
  post(r.wasted, amount(impact.wastedRappen), C.today, true);
  note(r.detail(impact.wastedCount, kg(impact.wastedGrams)));
  y += 1;
  rule('dashed', y);
  y += 8;
  post(r.inStock, amount(report.fridge.valueRappen));
  note(t.items(report.fridge.itemCount));
  post(r.spent, amount(report.shopping.spentRappen));
  note(t.receipts(report.shopping.receiptCount));
  y += 1;
  rule('double', y);
  y += 9;
  const share = impact.savedShare;
  text(r.rate, left, y, mono(10.5, C.ink, true));
  text(share === null ? '–' : `${String(Math.round(share * 100))} %`, right, y, {
    ...mono(10.5, C.ink, true),
    align: 'right',
  });
  y += 8;
  text(r.total, left, y, mono(12.5, C.smaragd, true));
  text(amount(impact.savedRappen), right, y, { ...mono(12.5, C.smaragd, true), align: 'right' });
  y += 5;
  rule('double', y);

  // Foot: a decorative barcode and a thank-you.
  y += 14;
  if (paint) {
    barcode(
      doc,
      { x: center - 30, y, width: 60, height: 11 },
      `${options.household}|${options.period}|${options.createdOn}`,
    );
  }
  y += 18;
  text(r.thanks, center, y, { ...mono(9, C.ink), align: 'center' });
  return y + 12 - top;
}

/** The large title of the detail pages, like the pages of the app. */
function details(doc: jsPDF, options: { household: string; period: string }, y: number): number {
  write(doc, t.heading, PAGE.margin, y + 8, { size: 28, color: C.onyx, bold: true });
  write(doc, `${options.household} · ${options.period}`, PAGE.margin, y + 15.5, {
    size: 11,
    color: C.muted,
  });
  return y + 17;
}

/** «Was auffällt» as a tip card like «Kühlschrank-Check»: green title, one line per finding. */
function insights({ doc }: Context, report: Report, money: Money, y: number): number {
  const lines = reportInsights(report, money);
  const pad = 7;
  const textX = PAGE.margin + pad + 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  const wrapped = lines.map(
    (line) => doc.splitTextToSize(line, CONTENT - (textX - PAGE.margin) - pad) as string[],
  );
  const lineHeight = 5.1;
  const gap = 2.2;
  const text = wrapped.reduce((sum, rows) => sum + rows.length * lineHeight + gap, -gap);
  const height = pad + 4 + 5 + text + pad - 1.5;
  card(doc, { x: PAGE.margin, y, width: CONTENT, height }, C.smaragdTint);
  write(doc, t.insights, PAGE.margin + pad, y + pad + 4, {
    size: 12,
    color: C.smaragdDeep,
    bold: true,
  });
  let at = y + pad + 4 + 8;
  for (const rows of wrapped) {
    doc.setFillColor(...C.smaragd);
    doc.circle(PAGE.margin + pad + 1, at - 1.25, 1, 'F');
    rows.forEach((row, index) => {
      write(doc, row, textX, at + index * lineHeight, { size: 10.5, color: C.ink });
    });
    at += rows.length * lineHeight + gap;
  }
  return y + height;
}

/** Saved and wasted per month as columns in a white card, legend in the card's top row. */
function months({ doc, report, amount }: Context, y: number): number {
  const start = section(doc, t.months, y);
  const height = 80;
  const box = { x: PAGE.margin, y: start, width: CONTENT, height };
  card(doc, box);
  const legend: [string, Rgb][] = [
    [t.saved, C.smaragd],
    [t.wasted, C.today],
  ];
  let right = box.x + box.width - 7;
  for (const [label, color] of [...legend].reverse()) {
    const style = { size: 8.5, color: C.ink, align: 'right' as const, baseline: 'middle' as const };
    write(doc, label, right, box.y + 8, style);
    const width = measure(doc, label, style);
    doc.setFillColor(...color);
    doc.circle(right - width - 2.6, box.y + 8, 1.3, 'F');
    right -= width + 9;
  }
  columns(
    doc,
    { x: box.x + 7, y: box.y + 12, width: box.width - 14, height: box.height - 16 },
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
  return start + height;
}

interface ListRow {
  icon: string;
  name: string;
  detail: string;
  chip: { label: string; tone: Tone };
  value?: string;
}

const ROW = 13.5;

/**
 * Rows like the app's item list: emoji, name, a grey detail line, the status chip and the value
 * on the right, hairlines inset under the text. Long lists continue on the next page.
 */
function list({ doc, pictures }: Context, rows: readonly ListRow[], y: number): number {
  let at = y;
  let index = 0;
  while (index < rows.length) {
    const fits = Math.max(1, Math.floor((FOOTER - 6 - at) / ROW));
    const chunk = rows.slice(index, index + fits);
    const box = { x: PAGE.margin, y: at, width: CONTENT, height: chunk.length * ROW };
    card(doc, box);
    chunk.forEach((row, position) => {
      const top = at + position * ROW;
      const middle = top + ROW / 2;
      if (pictures.emoji === undefined) {
        doc.setFillColor(...C.oat);
        doc.circle(box.x + 9, middle, 3.4, 'F');
      } else {
        emoji(doc, pictures, row.icon, { x: box.x + 9, y: middle }, 7);
      }
      const right = box.x + box.width - 6;
      const valueWidth =
        row.value === undefined
          ? 0
          : measure(doc, row.value, { size: 10, color: C.ink, bold: true });
      if (row.value !== undefined) {
        write(doc, row.value, right, middle, {
          size: 10,
          color: C.ink,
          bold: true,
          align: 'right',
          baseline: 'middle',
        });
      }
      const chipWidth = chip(
        doc,
        row.chip.label,
        right - (valueWidth > 0 ? valueWidth + 4 : 0),
        middle,
        row.chip.tone,
      );
      const textX = box.x + 17;
      const textWidth = right - (valueWidth > 0 ? valueWidth + 4 : 0) - chipWidth - 4 - textX;
      write(
        doc,
        row.name,
        textX,
        middle - 2.4,
        { size: 11, color: C.ink, bold: true, baseline: 'middle' },
        textWidth,
      );
      write(
        doc,
        row.detail,
        textX,
        middle + 2.8,
        { size: 9, color: C.muted, baseline: 'middle' },
        textWidth,
      );
      if (position < chunk.length - 1) {
        doc.setDrawColor(...C.line);
        doc.setLineWidth(0.2);
        doc.line(textX, top + ROW, box.x + box.width, top + ROW);
      }
    });
    index += chunk.length;
    at += chunk.length * ROW;
    if (index < rows.length) {
      at = newPage(doc);
    }
  }
  return at;
}

function itemRow(report: Report, item: ReportItem, value?: string): ListRow {
  const badge = expiryBadge(
    expiryStatus(item.expiresOn, report.today, item.expiryKind ?? 'best_before'),
    item.expiresOn,
    report.today,
    item.location,
  );
  return {
    icon: emojiOf(item.categoryId),
    name: item.name,
    detail: `${formatQuantity(item.quantity, item.unit)} · ${messages.locations[item.location]}`,
    chip: badge,
    ...(value === undefined ? {} : { value }),
  };
}

/** «Jetzt essen»: what expires within three days, as in «Läuft bald ab» on Start. */
function urgent(ctx: Context, y: number): number {
  const { doc, report } = ctx;
  const start = section(doc, t.urgent, y);
  if (report.fridge.urgent.length === 0) {
    card(doc, { x: PAGE.margin, y: start, width: CONTENT, height: 14 });
    write(doc, t.noUrgent, PAGE.margin + 7, start + 7, {
      size: 10.5,
      color: C.muted,
      baseline: 'middle',
    });
    return start + 14;
  }
  return list(
    ctx,
    report.fridge.urgent.map((item) => itemRow(report, item)),
    start,
  );
}

/** Two cards: what lands in the bin (with the food emoji) and why. */
function waste(ctx: Context, y: number): number {
  const { doc, report, amount, pictures } = ctx;
  const byCategory: BarRow[] = report.impact.topWasted.slice(0, 5).map((entry) => ({
    label: categoryById(entry.categoryId)?.name.de ?? entry.categoryId,
    value: entry.valueRappen,
    display: amount(entry.valueRappen),
    color: C.today,
    icon: emojiOf(entry.categoryId),
  }));
  const reasons: BarRow[] = report.impact.reasons.slice(0, 5).map((entry) => ({
    label: messages.wasteReasons[entry.reason],
    value: entry.count,
    display: `${String(entry.count)}×`,
    color: C.today,
  }));
  const height = 20 + Math.max(1, byCategory.length, reasons.length) * 9;
  const start = section(doc, t.wasteTop, room(doc, y, height + 6));
  const left = { x: PAGE.margin, y: start, width: HALF, height };
  const right = { x: PAGE.margin + HALF + GUTTER, y: start, width: HALF, height };
  card(doc, left);
  card(doc, right);
  write(doc, t.byCategory, left.x + 6, start + 9, { size: 10.5, color: C.ink, bold: true });
  write(doc, t.reasons, right.x + 6, start + 9, { size: 10.5, color: C.ink, bold: true });
  if (byCategory.length === 0) {
    write(doc, t.noWaste, left.x + 6, start + 18, { size: 10, color: C.muted });
  } else {
    bars(doc, pictures, { x: left.x + 6, y: start + 13, width: HALF - 12 }, byCategory, {
      labelWidth: 33,
      valueWidth: 17,
    });
  }
  if (reasons.length === 0) {
    write(doc, t.none, right.x + 6, start + 18, { size: 10, color: C.muted });
  } else {
    bars(doc, pictures, { x: right.x + 6, y: start + 13, width: HALF - 12 }, reasons, {
      labelWidth: 26,
      valueWidth: 8,
    });
  }
  return start + height;
}

/** Two cards: where the value in stock sits, and where the money was spent. */
function places(ctx: Context, y: number): number {
  const { doc, report, amount, pictures } = ctx;
  const byPlace: BarRow[] = report.fridge.byLocation
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
  const height = 22 + Math.max(2, byPlace.length + 1, shops.length + 1) * 8.6;
  const start = section(doc, t.money, room(doc, y, height + 6));
  const left = { x: PAGE.margin, y: start, width: HALF, height };
  const right = { x: PAGE.margin + HALF + GUTTER, y: start, width: HALF, height };
  card(doc, left);
  card(doc, right);
  write(doc, t.byPlace, left.x + 6, start + 9, { size: 10.5, color: C.ink, bold: true });
  write(doc, t.byShop, right.x + 6, start + 9, { size: 10.5, color: C.ink, bold: true });
  if (byPlace.length === 0) {
    write(doc, t.none, left.x + 6, start + 18, { size: 10, color: C.muted });
  } else {
    stack(doc, { x: left.x + 6, y: start + 14, width: HALF - 12 }, byPlace);
  }
  if (shops.length === 0) {
    write(doc, t.none, right.x + 6, start + 18, { size: 10, color: C.muted });
  } else {
    const used = bars(doc, pictures, { x: right.x + 6, y: start + 13, width: HALF - 12 }, shops, {
      labelWidth: 20,
      valueWidth: 19,
    });
    const total = start + 13 + used + 4.5;
    write(doc, t.total, right.x + 6, total, { size: 9.5, color: C.muted, bold: true });
    write(doc, amount(report.shopping.spentRappen), right.x + HALF - 6, total, {
      size: 9.5,
      color: C.ink,
      bold: true,
      align: 'right',
    });
  }
  return start + height;
}

/** «Alles im Vorrat» as the app's list, on its own page when it would leave orphaned rows. */
function inventory(ctx: Context, y: number): void {
  const { doc, report, amount } = ctx;
  const items = report.fridge.items;
  const fitsHere = y + 5 + items.length * ROW <= FOOTER - 6;
  const start = section(doc, t.inventory, fitsHere ? y : newPage(doc));
  if (items.length === 0) {
    write(doc, t.none, PAGE.margin, start + 6, { size: 10, color: C.muted });
    return;
  }
  const end = list(
    ctx,
    items.map((item) =>
      itemRow(report, item, `${amount(item.valueRappen)}${item.valueEstimated ? ' *' : ''}`),
    ),
    start,
  );
  if (report.fridge.valueEstimated || report.impact.estimated) {
    write(doc, t.estimated, PAGE.margin, Math.min(end + 6, FOOTER - 3), {
      size: 8,
      color: C.muted,
    });
  }
}

function footers(doc: jsPDF): void {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.2);
    doc.line(PAGE.margin, FOOTER, PAGE.margin + CONTENT, FOOTER);
    const style = { size: 8, color: C.muted };
    write(doc, t.footer, PAGE.margin, FOOTER + 5, style);
    write(doc, t.page(page, pages), PAGE.margin + CONTENT, FOOTER + 5, {
      ...style,
      align: 'right',
    });
  }
}
