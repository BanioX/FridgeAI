import {
  categoryById,
  expiryStatus,
  fallbackCategory,
  formatSwissDate,
  rappen,
  type LocalDate,
  type Report,
  type ReportItem,
  type StorageLocation,
} from '@fridgeai/core';
import type { jsPDF } from 'jspdf';
import { messages } from '../../app/messages.de-CH';
import { CHF_MONEY, type Money } from '../../app/money-format';
import { expiryBadge } from '../../ui/expiry-badge';
import { formatQuantity } from '../../ui/quantity-text';
import type { Tone } from '../../ui/tones';
import {
  bars,
  FOOTER,
  footers,
  card,
  chip,
  columns,
  emoji,
  ground,
  measure,
  PAGE,
  PDF_COLOR as C,
  placeBadge,
  ring,
  roundedPicture,
  stack,
  TOP,
  write,
  type BarRow,
  type PdfPictures,
  type Rgb,
} from './pdf-kit';
import { reportInsights } from './report-insights';

const t = messages.reports.pdf;
const CONTENT = PAGE.width - 2 * PAGE.margin;
const GUTTER = 5;
const HALF = (CONTENT - GUTTER) / 2;
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
 * The detailed report («Ausführlich») as an A4 PDF on the device (ADR-0030), in the design
 * language of the app: silver ground, white cards with a soft shadow, the large title, lists
 * like «Vorrat» with the food emoji and the same status chips. «Was auffällt», the months, what to
 * eat now, what is wasted and why, where the value and the money are, then everything in stock.
 * The short reports are receipts (`receipt-pdf.ts`); this one has none. jsPDF loads only now.
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
    title: `Rettich – ${t.heading}`,
    subject: options.period,
    creator: 'Rettich',
  });
  const ctx: Context = {
    doc,
    report,
    amount: (value, format) => money.format(rappen(value), format),
    pictures: options.pictures ?? {},
  };

  ground(doc);
  let y = masthead(ctx, options, TOP);
  y = hero(ctx, y + 6);
  y = keyFigures(ctx, y + 5);
  y = insights(ctx, report, money, y + 6);
  y = months(ctx, room(doc, y + 12, 96));
  y = urgent(ctx, y + 12);
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
 * The head of the detailed report, its own and not a receipt (Alban, 8.11.2026): the app icon
 * and «Rettich» on the left, the date on the right, a hairline, then the large title like in
 * the app.
 */
function masthead(
  { doc, pictures }: Context,
  options: { household: string; period: string; createdOn: LocalDate },
  y: number,
): number {
  const logo = 10;
  const middle = y + logo / 2;
  if (pictures.logo === undefined) {
    card(doc, { x: PAGE.margin, y, width: logo, height: logo }, C.smaragd, 2.6);
  } else {
    roundedPicture(doc, pictures.logo, { x: PAGE.margin, y, size: logo }, 2.6);
  }
  write(doc, 'Rettich', PAGE.margin + logo + 3.5, middle, {
    size: 13,
    color: C.onyx,
    bold: true,
    baseline: 'middle',
  });
  write(doc, t.created(formatSwissDate(options.createdOn)), PAGE.width - PAGE.margin, middle, {
    size: 9,
    color: C.muted,
    align: 'right',
    baseline: 'middle',
  });
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.2);
  doc.line(PAGE.margin, y + logo + 5, PAGE.width - PAGE.margin, y + logo + 5);
  const title = y + logo + 19;
  write(doc, t.heading, PAGE.margin, title, { size: 28, color: C.onyx, bold: true });
  write(doc, `${options.household} · ${options.period}`, PAGE.margin, title + 7.5, {
    size: 11,
    color: C.muted,
  });
  return title + 9.5;
}

/**
 * The onyx card of the app: the money saved, a sentence, and the rescue rate as a ring
 * (Alban, 8.11.2026: «Ich liebe das Schwarze, gibt Premium-Look, und die Kreise ein Augenschmaus»).
 */
function hero({ doc, report, amount }: Context, y: number): number {
  const height = 48;
  card(doc, { x: PAGE.margin, y, width: CONTENT, height }, C.onyx);
  const left = PAGE.margin + 9;
  write(doc, amount(report.impact.savedRappen), left, y + 21, {
    size: 34,
    color: C.white,
    bold: true,
  });
  write(doc, t.heroSentence, left, y + 30.5, { size: 13, color: C.white });
  write(doc, t.savedDetail(kg(report.impact.savedGrams), report.impact.savedCount), left, y + 39, {
    size: 9.5,
    color: C.silver,
  });
  const center = { x: PAGE.margin + CONTENT - 25, y: y + height / 2 };
  const share = report.impact.savedShare;
  ring(doc, center, 14, 3.8, share, C.onyxRaised, C.smaragdMid);
  write(
    doc,
    share === null ? '–' : `${String(Math.round(share * 100))} %`,
    center.x,
    center.y - 1.4,
    { size: 15, color: C.white, bold: true, align: 'center', baseline: 'middle' },
  );
  write(doc, t.rateLabel, center.x, center.y + 5, {
    size: 8,
    color: C.silver,
    align: 'center',
    baseline: 'middle',
  });
  return y + height;
}

/** Three white cards of equal size: label, value and detail on the same lines in each. */
function keyFigures({ doc, report, amount }: Context, y: number): number {
  const tiles: [string, string, string, Rgb][] = [
    [t.inStock, amount(report.fridge.valueRappen), t.items(report.fridge.itemCount), C.ink],
    [t.wasted, amount(report.impact.wastedRappen), kg(report.impact.wastedGrams), C.today],
    [t.spent, amount(report.shopping.spentRappen), t.receipts(report.shopping.receiptCount), C.ink],
  ];
  const width = (CONTENT - GUTTER * (tiles.length - 1)) / tiles.length;
  const height = 29.5;
  tiles.forEach(([label, value, detail, color], index) => {
    const x = PAGE.margin + index * (width + GUTTER);
    card(doc, { x, y, width, height });
    write(doc, label, x + 6, y + 8.5, { size: 9, color: C.muted, bold: true }, width - 12);
    write(doc, value, x + 6, y + 18.5, { size: 17, color, bold: true }, width - 12);
    write(doc, detail, x + 6, y + 24.6, { size: 9, color: C.muted }, width - 12);
  });
  return y + height;
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
  /** Fridge, freezer, pantry or reserve, as a badge in the middle of the row. */
  place?: StorageLocation;
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
      const chipLeft = right - (valueWidth > 0 ? valueWidth + 4 : 0) - chipWidth;
      // The place badges stand in one column in the middle, the name ends before them.
      const textEnd =
        row.place === undefined
          ? chipLeft - 4
          : placeBadge(
              doc,
              messages.locations[row.place],
              { left: box.x + box.width * 0.47, limit: chipLeft - 3, middle },
              LOCATION_COLOR[row.place],
            ) - 4;
      const textWidth = textEnd - textX;
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
    detail: formatQuantity(item.quantity, item.unit),
    chip: badge,
    place: item.location,
    ...(value === undefined ? {} : { value }),
  };
}

/** «Jetzt verwerten»: what expires within three days, as in «Läuft bald ab» on Start. */
/** «Jetzt verwerten» stays in one piece: it moves to the next page whole when that is enough. */
function urgent(ctx: Context, y: number): number {
  const { doc, report } = ctx;
  const height = 5 + Math.max(14, report.fridge.urgent.length * ROW);
  const start = section(doc, t.urgent, room(doc, y, height <= FOOTER - 6 - TOP ? height : 34));
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
