import type { Retailer } from '@fridgeai/core';
import type { jsPDF } from 'jspdf';
import { messages } from '../../app/messages.de-CH';
import type { Tone } from '../../ui/tones';

/**
 * A small drawing kit for the PDF report (ADR-0030) in the app's own design language
 * (docs/design.md): silver ground, white cards without borders and with a soft shadow, Smaragd
 * for what matters, the same status chips as the app and the food pictures of the app, and the
 * receipt paper of the cover. Vector
 * only, except the pictures the device draws (logo, food pictures). Everything lines up on one axis and
 * no text is ever clipped («Immer sauber ausgerichtet»): long labels are shortened with «…».
 */
export type Rgb = readonly [number, number, number];

/** Colours of docs/design.md (ADR-0035). */
export const PDF_COLOR = {
  smaragd: [19, 94, 66],
  smaragdDeep: [13, 74, 51],
  smaragdMid: [89, 168, 132],
  smaragdSoft: [180, 224, 202],
  smaragdTint: [238, 249, 243],
  onyx: [13, 16, 18],
  onyxRaised: [43, 47, 52],
  ink: [20, 22, 26],
  muted: [91, 97, 104],
  line: [219, 222, 226],
  oat: [243, 244, 246],
  surfaceMuted: [233, 235, 237],
  silver: [186, 190, 196],
  today: [166, 58, 34],
  white: [255, 255, 255],
} as const satisfies Record<string, Rgb>;

/** The chip tones of `ui/tones.ts`, as text and fill colour. */
export const TONE_COLOR: Record<Tone, { text: Rgb; fill: Rgb }> = {
  fresh: { text: [19, 94, 66], fill: [238, 249, 243] },
  soon: { text: [138, 75, 15], fill: [255, 241, 223] },
  today: { text: [166, 58, 34], fill: [253, 235, 230] },
  danger: { text: [255, 255, 255], fill: [179, 38, 30] },
  ice: { text: [42, 107, 140], fill: [230, 243, 248] },
  wheat: { text: [138, 95, 20], fill: [248, 240, 220] },
  olive: { text: [79, 93, 39], fill: [236, 238, 224] },
  neutral: { text: [91, 97, 104], fill: [233, 235, 237] },
};

/** Pictures the device can draw for the PDF (see `pdf-assets.ts`); both are optional. */
export interface PdfPictures {
  /** The app icon as PNG data URL. */
  logo?: string;
  /** The food picture of a category as JPEG data URL, the same as in the app (ADR-0080). */
  food?: (categoryId: string) => string | undefined;
}

export interface TextStyle {
  size: number;
  color: Rgb;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  baseline?: 'alphabetic' | 'middle' | 'top';
  /** Helvetica by default; Courier for the receipt. */
  font?: 'helvetica' | 'courier';
}

function applyFont(doc: jsPDF, style: TextStyle): void {
  doc.setFont(style.font ?? 'helvetica', style.bold === true ? 'bold' : 'normal');
  doc.setFontSize(style.size);
  doc.setTextColor(...style.color);
}

/** Text shortened with «…» until it fits `width` millimetres. */
export function fit(doc: jsPDF, value: string, width: number, style: TextStyle): string {
  applyFont(doc, style);
  if (doc.getTextWidth(value) <= width) {
    return value;
  }
  let text = value;
  while (text.length > 1 && doc.getTextWidth(`${text}…`) > width) {
    text = text.slice(0, -1);
  }
  return `${text.trimEnd()}…`;
}

export function write(
  doc: jsPDF,
  value: string,
  x: number,
  y: number,
  style: TextStyle,
  width?: number,
): void {
  const text = width === undefined ? value : fit(doc, value, width, style);
  applyFont(doc, style);
  doc.text(text, x, y, { align: style.align ?? 'left', baseline: style.baseline ?? 'alphabetic' });
}

/** Width of a text in millimetres. */
export function measure(doc: jsPDF, value: string, style: TextStyle): number {
  applyFont(doc, style);
  return doc.getTextWidth(value);
}

/** The silver ground of a page, like the app's background. */
export function ground(doc: jsPDF): void {
  doc.setFillColor(...PDF_COLOR.oat);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
}

/**
 * A card like the app's: 4.5 mm corners (16 px), no border. White cards get the soft
 * `shadow-card` as two slightly darker rings below them.
 */
export function card(
  doc: jsPDF,
  box: { x: number; y: number; width: number; height: number },
  fill: Rgb = PDF_COLOR.white,
  radius = 4.5,
): void {
  if (fill === PDF_COLOR.white) {
    const halo: [number, Rgb][] = [
      [0.9, [237, 239, 241]],
      [0.45, [230, 232, 235]],
    ];
    for (const [spread, color] of halo) {
      doc.setFillColor(...color);
      doc.roundedRect(
        box.x - spread / 2,
        box.y + spread,
        box.width + spread,
        box.height,
        radius + spread / 2,
        radius + spread / 2,
        'F',
      );
    }
  }
  doc.setFillColor(...fill);
  doc.roundedRect(box.x, box.y, box.width, box.height, radius, radius, 'F');
}

/** A picture clipped to rounded corners (the app icon). */
export function roundedPicture(
  doc: jsPDF,
  dataUrl: string,
  box: { x: number; y: number; size: number },
  radius: number,
): void {
  doc.saveGraphicsState();
  doc.roundedRect(box.x, box.y, box.size, box.size, radius, radius, null);
  doc.clip();
  doc.discardPath();
  doc.addImage(dataUrl, 'PNG', box.x, box.y, box.size, box.size, 'rettich-logo');
  doc.restoreGraphicsState();
}

/**
 * The food picture of a category centred on `x`/`middle`, or nothing if the device cannot draw
 * it. An opaque JPEG: no transparency, so no soft mask that some viewers draw grey.
 */
export function foodPicture(
  doc: jsPDF,
  pictures: PdfPictures,
  categoryId: string,
  center: { x: number; y: number },
  size: number,
): void {
  const dataUrl = pictures.food?.(categoryId);
  if (dataUrl !== undefined) {
    doc.addImage(
      dataUrl,
      'JPEG',
      center.x - size / 2,
      center.y - size / 2,
      size,
      size,
      `food-${categoryId}`,
    );
  }
}

/** A bar with round ends (a pill), or with `corner` mm corners; never rounder than it is wide. */
function bar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Rgb,
  corner?: number,
): void {
  if (width <= 0 || height <= 0) {
    return;
  }
  const radius = Math.min(corner ?? Infinity, width / 2, height / 2);
  doc.setFillColor(...color);
  doc.roundedRect(x, y, width, height, radius, radius, 'F');
}

/**
 * Round steps for an axis: `count` steps of 1, 2, 2.5 or 5 × 10ⁿ that reach at least `max`.
 * `niceTicks(1210, 3)` is `[0, 500, 1000, 1500]`.
 */
export function niceTicks(max: number, count = 3): number[] {
  if (max <= 0) {
    return [0, 1];
  }
  const rough = max / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 2.5, 5, 10].find((factor) => factor * power >= rough) ?? 10) * power;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  return ticks;
}

export interface ColumnGroup {
  label: string;
  values: { value: number; color: Rgb }[];
}

/**
 * Grouped columns with a light grid: tick labels on the left, each group centred over its label,
 * the value above each column.
 */
export function columns(
  doc: jsPDF,
  box: { x: number; y: number; width: number; height: number },
  groups: readonly ColumnGroup[],
  format: (value: number) => string,
  formatTick: (value: number) => string = format,
): void {
  const axis = 12;
  const plot = {
    x: box.x + axis,
    width: box.width - axis,
    top: box.y + 6,
    bottom: box.y + box.height - 7,
  };
  const max = Math.max(0, ...groups.flatMap((group) => group.values.map((entry) => entry.value)));
  const ticks = niceTicks(max, 3);
  const top = ticks.at(-1) ?? 1;
  const yOf = (value: number) => plot.bottom - (value / top) * (plot.bottom - plot.top);
  const small: TextStyle = { size: 8, color: PDF_COLOR.muted };
  doc.setLineWidth(0.2);
  for (const tick of ticks) {
    const y = yOf(tick);
    const grid: Rgb = tick === 0 ? PDF_COLOR.silver : PDF_COLOR.line;
    doc.setDrawColor(...grid);
    doc.line(plot.x, y, plot.x + plot.width, y);
    write(doc, formatTick(tick), plot.x - 2.5, y, { ...small, align: 'right', baseline: 'middle' });
  }
  const slot = plot.width / Math.max(1, groups.length);
  groups.forEach((group, index) => {
    const center = plot.x + slot * index + slot / 2;
    const count = Math.max(1, group.values.length);
    const width = Math.min(6.5, (slot * 0.55 - (count - 1)) / count);
    const groupWidth = count * width + (count - 1) * 1.2;
    group.values.forEach((entry, position) => {
      const x = center - groupWidth / 2 + position * (width + 1.2);
      const y = yOf(entry.value);
      if (entry.value > 0) {
        // Softly rounded top, square foot on the axis.
        const corner = Math.min(1.4, (plot.bottom - y) / 2);
        bar(doc, x, y, width, plot.bottom - y, entry.color, corner);
        doc.setFillColor(...entry.color);
        doc.rect(x, plot.bottom - corner, width, corner, 'F');
        write(doc, format(entry.value), x + width / 2, y - 1.6, {
          size: 7,
          color: entry.color,
          bold: true,
          align: 'center',
        });
      }
    });
    write(doc, group.label, center, plot.bottom + 5.5, {
      ...small,
      color: PDF_COLOR.ink,
      align: 'center',
    });
  });
}

export interface BarRow {
  label: string;
  value: number;
  display: string;
  color: Rgb;
  /** The category whose food picture stands in front of the label. */
  icon?: string;
}

/**
 * Horizontal bars in a card: food picture and label on the left, the bar on a silver track, the value
 * on the right. Returns the height used.
 */
export function bars(
  doc: jsPDF,
  pictures: PdfPictures,
  box: { x: number; y: number; width: number },
  rows: readonly BarRow[],
  options: { labelWidth: number; valueWidth: number },
): number {
  const rowHeight = 9;
  const iconWidth = rows.some((row) => row.icon !== undefined) && pictures.food ? 7 : 0;
  const labelX = box.x + iconWidth;
  const trackX = labelX + options.labelWidth + 2;
  const trackWidth = box.width - iconWidth - options.labelWidth - options.valueWidth - 4;
  const max = Math.max(1, ...rows.map((row) => row.value));
  rows.forEach((row, index) => {
    const middle = box.y + index * rowHeight + rowHeight / 2;
    if (iconWidth > 0 && row.icon !== undefined) {
      foodPicture(doc, pictures, row.icon, { x: box.x + 2.6, y: middle }, 5.2);
    }
    write(
      doc,
      row.label,
      labelX,
      middle,
      { size: 9.5, color: PDF_COLOR.ink, baseline: 'middle' },
      options.labelWidth,
    );
    bar(doc, trackX, middle - 1.75, trackWidth, 3.5, PDF_COLOR.oat);
    bar(doc, trackX, middle - 1.75, Math.max(3.5, (row.value / max) * trackWidth), 3.5, row.color);
    write(doc, row.display, box.x + box.width, middle, {
      size: 9.5,
      color: PDF_COLOR.ink,
      bold: true,
      align: 'right',
      baseline: 'middle',
    });
  });
  return rows.length * rowHeight;
}

/** One bar split into parts, with a legend row per part below. Returns the height used. */
export function stack(
  doc: jsPDF,
  box: { x: number; y: number; width: number },
  parts: readonly BarRow[],
): number {
  const { x, y, width } = box;
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  const height = 6;
  bar(doc, x, y, width, height, PDF_COLOR.oat);
  const visible = parts.filter((part) => part.value > 0);
  let at = x;
  visible.forEach((part, index) => {
    const partWidth = total > 0 ? (part.value / total) * width : 0;
    const first = index === 0;
    const last = index === visible.length - 1;
    // Square parts in the middle; the outer ends keep the pill's round caps.
    bar(doc, at, y, partWidth, height, part.color);
    doc.setFillColor(...part.color);
    const from = first ? at + partWidth / 2 : at;
    const to = last ? at + partWidth / 2 : at + partWidth;
    if (to > from) {
      doc.rect(from, y, to - from, height, 'F');
    }
    at += partWidth;
  });
  const rowHeight = 8;
  parts.forEach((part, index) => {
    const middle = y + height + 4.5 + index * rowHeight + rowHeight / 2;
    doc.setFillColor(...part.color);
    doc.circle(x + 1.5, middle, 1.5, 'F');
    write(doc, part.label, x + 5, middle, { size: 9.5, color: PDF_COLOR.ink, baseline: 'middle' });
    write(doc, part.display, x + width, middle, {
      size: 9.5,
      color: PDF_COLOR.ink,
      bold: true,
      align: 'right',
      baseline: 'middle',
    });
  });
  return height + 4.5 + parts.length * rowHeight;
}

/** A status chip like the app's, right-aligned at `right`. Returns its width. */
export function chip(doc: jsPDF, value: string, right: number, middle: number, tone: Tone): number {
  const colors = TONE_COLOR[tone];
  const style: TextStyle = { size: 8.5, color: colors.text, bold: true };
  const width = measure(doc, value, style) + 5.6;
  card(doc, { x: right - width, y: middle - 2.9, width, height: 5.8 }, colors.fill, 2.9);
  write(doc, value, right - width / 2, middle + 0.1, {
    ...style,
    align: 'center',
    baseline: 'middle',
  });
  return width;
}

/**
 * Where an item lies, as a quiet grey badge with a coloured dot (Alban, 8.11.2026), left-aligned
 * at `left` so the badges of a list form a column, moved left when it would reach `limit`.
 * Returns where it starts.
 */
export function placeBadge(
  doc: jsPDF,
  label: string,
  at: { left: number; limit: number; middle: number },
  dot: Rgb,
): number {
  const style: TextStyle = { size: 8.5, color: PDF_COLOR.muted, bold: true };
  const width = measure(doc, label, style) + 9;
  const left = Math.min(at.left, at.limit - width);
  const { middle } = at;
  card(doc, { x: left, y: middle - 2.9, width, height: 5.8 }, PDF_COLOR.oat, 2.9);
  doc.setFillColor(...dot);
  doc.circle(left + 3.4, middle, 1.1, 'F');
  write(doc, label, left + 5.6, middle + 0.1, { ...style, baseline: 'middle' });
  return left;
}

/** Side of the shop letter tile in the lists, in mm. */
export const SHOP_MARK = 4.2;

/** Each shop's letter in the look of its sign (see `ui/ShopBadge.tsx`, Alban 8.11.2026). */
const SHOP_LOOK: Record<
  Exclude<Retailer, 'other'>,
  { letter: string; tile: Rgb; ink: Rgb; border?: Rgb; disc?: Rgb; frame?: Rgb; italic?: boolean }
> = {
  coop: { letter: 'c', tile: [255, 255, 255], ink: [232, 88, 12], border: [228, 228, 231] },
  migros: { letter: 'M', tile: [255, 255, 255], ink: [240, 106, 29], border: [228, 228, 231] },
  denner: { letter: 'D', tile: [215, 0, 30], ink: [255, 255, 255], italic: true },
  lidl: { letter: 'L', tile: [0, 80, 170], ink: [0, 80, 170], disc: [255, 240, 0] },
  aldi: { letter: 'A', tile: [16, 28, 99], ink: [255, 255, 255], frame: [243, 146, 0] },
};

/**
 * A shop's letter as a small tile, in the look of its sign like `ui/ShopBadge.tsx`. `left` is the
 * tile's left edge; returns nothing.
 */
export function shopMark(
  doc: jsPDF,
  retailer: Exclude<Retailer, 'other'>,
  left: number,
  middle: number,
): void {
  const look = SHOP_LOOK[retailer];
  const top = middle - SHOP_MARK / 2;
  doc.setFillColor(...look.tile);
  if (look.border === undefined) {
    doc.roundedRect(left, top, SHOP_MARK, SHOP_MARK, 1, 1, 'F');
  } else {
    doc.setDrawColor(...look.border);
    doc.setLineWidth(0.15);
    doc.roundedRect(left, top, SHOP_MARK, SHOP_MARK, 1, 1, 'FD');
  }
  if (look.frame !== undefined) {
    doc.setDrawColor(...look.frame);
    doc.setLineWidth(0.25);
    doc.roundedRect(left + 0.45, top + 0.45, SHOP_MARK - 0.9, SHOP_MARK - 0.9, 0.7, 0.7, 'S');
  }
  if (look.disc !== undefined) {
    doc.setFillColor(...look.disc);
    doc.circle(left + SHOP_MARK / 2, middle, SHOP_MARK * 0.37, 'F');
  }
  doc.setFont('helvetica', look.italic === true ? 'bolditalic' : 'bold');
  doc.setFontSize(look.disc === undefined ? 7.5 : 6);
  doc.setTextColor(...look.ink);
  doc.text(look.letter, left + SHOP_MARK / 2, middle - 0.1, {
    align: 'center',
    baseline: 'middle',
  });
}

/**
 * The «Gehört» mark (ADR-0058) of a list row: the owner's initials in a small round-cornered tile,
 * in the style of the shop tile. `left` is the left edge; returns the width drawn.
 */
export function ownerMark(doc: jsPDF, initials: string, left: number, middle: number): number {
  const style: TextStyle = { size: 6.5, color: PDF_COLOR.muted, bold: true };
  const width = Math.max(SHOP_MARK, measure(doc, initials, style) + 2);
  card(doc, { x: left, y: middle - SHOP_MARK / 2, width, height: SHOP_MARK }, PDF_COLOR.oat, 1);
  write(doc, initials, left + width / 2, middle + 0.1, {
    ...style,
    align: 'center',
    baseline: 'middle',
  });
  return width;
}

/** A dashed rule like on a till receipt. */
export function dashed(
  doc: jsPDF,
  from: number,
  to: number,
  y: number,
  color: Rgb = PDF_COLOR.silver,
): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.25);
  doc.setLineDashPattern([1.2, 1], 0);
  doc.line(from, y, to, y);
  doc.setLineDashPattern([], 0);
}

/** A round-capped arc from 12 o'clock, clockwise, over `share` of the circle. */
function arc(
  doc: jsPDF,
  center: { x: number; y: number },
  radius: number,
  thickness: number,
  share: number,
  color: Rgb,
): void {
  const steps = Math.max(12, Math.ceil(share * 144));
  const point = (step: number) => {
    const angle = -Math.PI / 2 + (step / steps) * share * 2 * Math.PI;
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
  };
  const start = point(0);
  const segments: number[][] = [];
  let last = start;
  for (let step = 1; step <= steps; step += 1) {
    const next = point(step);
    segments.push([next.x - last.x, next.y - last.y]);
    last = next;
  }
  doc.setDrawColor(...color);
  doc.setLineWidth(thickness);
  doc.setLineCap('round');
  doc.setLineJoin('round');
  doc.lines(segments, start.x, start.y, [1, 1], 'S', false);
  doc.setLineCap('butt');
}

/** A ring from 12 o'clock, clockwise: `share` of it in `fill`, the rest in `track`. */
export function ring(
  doc: jsPDF,
  center: { x: number; y: number },
  radius: number,
  thickness: number,
  share: number | null,
  track: Rgb,
  fill: Rgb,
): void {
  arc(doc, center, radius, thickness, 1, track);
  if (share !== null && share > 0) {
    arc(doc, center, radius, thickness, Math.min(1, share), fill);
  }
}

/** Two thin rules, the «total» line of a receipt. */
export function double(doc: jsPDF, from: number, to: number, y: number): void {
  doc.setDrawColor(...PDF_COLOR.ink);
  doc.setLineWidth(0.25);
  doc.line(from, y, to, y);
  doc.line(from, y + 0.9, to, y + 0.9);
}

/** The outline of receipt paper with torn, zig-zag edges at the top and the bottom. */
function paperOutline(box: { x: number; y: number; width: number; height: number }): number[][] {
  const tooth = 3;
  const depth = 1.4;
  const teeth = Math.max(1, Math.round(box.width / tooth));
  const step = box.width / teeth;
  const segments: number[][] = [];
  // Top edge, left to right, starting at the top-left corner.
  for (let index = 0; index < teeth; index += 1) {
    segments.push([step / 2, -depth], [step / 2, depth]);
  }
  segments.push([0, box.height]);
  // Bottom edge, right to left.
  for (let index = 0; index < teeth; index += 1) {
    segments.push([-step / 2, depth], [-step / 2, -depth]);
  }
  return segments;
}

/** White receipt paper with torn edges and a soft shadow, on the silver ground. */
export function receiptPaper(
  doc: jsPDF,
  box: { x: number; y: number; width: number; height: number },
): void {
  const shadows: [number, Rgb][] = [
    [1.4, [234, 236, 239]],
    [0.7, [226, 229, 232]],
  ];
  for (const [offset, color] of shadows) {
    doc.setFillColor(...color);
    doc.lines(paperOutline(box), box.x, box.y + offset, [1, 1], 'F', true);
  }
  doc.setFillColor(...PDF_COLOR.white);
  doc.lines(paperOutline(box), box.x, box.y, [1, 1], 'F', true);
}

/**
 * A decorative barcode made from `seed` (the same report always gets the same bars). It encodes
 * nothing and carries no data; it only makes the receipt look like one.
 */
export function barcode(
  doc: jsPDF,
  box: { x: number; y: number; width: number; height: number },
  seed: string,
): void {
  let state = 2166136261;
  for (const char of seed) {
    state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  const next = () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507) >>> 0;
    state = Math.imul(state ^ (state >>> 13), 3266489909) >>> 0;
    return (state >>> 0) / 4294967296;
  };
  doc.setFillColor(...PDF_COLOR.ink);
  let at = box.x;
  let bar = true;
  while (at < box.x + box.width) {
    const width = 0.3 + Math.floor(next() * 3) * 0.3;
    if (bar) {
      doc.rect(at, box.y, Math.min(width, box.x + box.width - at), box.height, 'F');
    }
    at += width;
    bar = !bar;
  }
}

/** A4 in millimetres, the margin of every page, where the footer starts and content begins. */
export const PAGE = { width: 210, height: 297, margin: 16 } as const;
export const FOOTER = PAGE.height - 14;
export const TOP = 22;

/** The footer of every page: a hairline, where the PDF was made, and the page number. */
export function footers(doc: jsPDF): void {
  const t = messages.reports.pdf;
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...PDF_COLOR.line);
    doc.setLineWidth(0.2);
    doc.line(PAGE.margin, FOOTER, PAGE.width - PAGE.margin, FOOTER);
    const style = { size: 8, color: PDF_COLOR.muted };
    write(doc, t.footer, PAGE.margin, FOOTER + 5, style);
    write(doc, t.page(page, pages), PAGE.width - PAGE.margin, FOOTER + 5, {
      ...style,
      align: 'right',
    });
  }
}
