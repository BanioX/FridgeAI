import type { jsPDF } from 'jspdf';
import type { Tone } from '../../ui/tones';

/**
 * A small drawing kit for the PDF report (ADR-0030) in the app's own design language
 * (docs/design.md): silver ground, white cards without borders and with a soft shadow, Smaragd
 * for what matters, the same status chips as the app and the food emoji of the app. Vector
 * only, except the pictures the device draws (logo, emoji). Everything lines up on one axis and
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
  /** A food emoji as PNG data URL, drawn by the device like in the app. */
  emoji?: (emoji: string) => string | undefined;
}

export interface TextStyle {
  size: number;
  color: Rgb;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  baseline?: 'alphabetic' | 'middle' | 'top';
}

function applyFont(doc: jsPDF, style: TextStyle): void {
  doc.setFont('helvetica', style.bold === true ? 'bold' : 'normal');
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

/** A food emoji centred on `x`/`middle`, or nothing if the device cannot draw it. */
export function emoji(
  doc: jsPDF,
  pictures: PdfPictures,
  value: string,
  center: { x: number; y: number },
  size: number,
): void {
  const dataUrl = pictures.emoji?.(value);
  if (dataUrl !== undefined) {
    doc.addImage(
      dataUrl,
      'PNG',
      center.x - size / 2,
      center.y - size / 2,
      size,
      size,
      `emoji-${value}`,
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
  /** A food emoji in front of the label. */
  icon?: string;
}

/**
 * Horizontal bars in a card: emoji and label on the left, the bar on a silver track, the value
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
  const iconWidth = rows.some((row) => row.icon !== undefined) && pictures.emoji ? 7 : 0;
  const labelX = box.x + iconWidth;
  const trackX = labelX + options.labelWidth + 2;
  const trackWidth = box.width - iconWidth - options.labelWidth - options.valueWidth - 4;
  const max = Math.max(1, ...rows.map((row) => row.value));
  rows.forEach((row, index) => {
    const middle = box.y + index * rowHeight + rowHeight / 2;
    if (iconWidth > 0 && row.icon !== undefined) {
      emoji(doc, pictures, row.icon, { x: box.x + 2.6, y: middle }, 5.2);
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
