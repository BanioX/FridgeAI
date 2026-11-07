import type { jsPDF } from 'jspdf';

/**
 * A small drawing kit for the PDF report (ADR-0030): the app's colours, text that aligns on a
 * grid, cards, a ring, column and bar charts. Vector only, so the PDF stays small and sharp.
 * Everything lines up on one axis and no text is ever clipped (docs/design.md, «Immer sauber
 * ausgerichtet»): long labels are shortened with «…».
 */
export type Rgb = readonly [number, number, number];

/** Colours of docs/design.md (ADR-0035): Smaragd, Silber, Onyx and the status colours. */
export const PDF_COLOR = {
  smaragd: [19, 94, 66],
  smaragdMid: [89, 168, 132],
  smaragdSoft: [180, 224, 202],
  smaragdTint: [238, 249, 243],
  onyx: [13, 16, 18],
  onyxRaised: [43, 47, 52],
  ink: [20, 22, 26],
  muted: [91, 97, 104],
  line: [219, 222, 226],
  oat: [243, 244, 246],
  silver: [186, 190, 196],
  today: [166, 58, 34],
  todayTint: [253, 235, 230],
  soon: [138, 75, 15],
  soonTint: [255, 241, 223],
  white: [255, 255, 255],
} as const satisfies Record<string, Rgb>;

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

export function card(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: Rgb,
  radius = 3,
): void {
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, width, height, radius, radius, 'F');
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
  const axis = 14;
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
  const small: TextStyle = { size: 7, color: PDF_COLOR.muted };
  doc.setLineWidth(0.2);
  for (const tick of ticks) {
    const y = yOf(tick);
    doc.setDrawColor(...(tick === 0 ? PDF_COLOR.silver : PDF_COLOR.line));
    doc.line(plot.x, y, plot.x + plot.width, y);
    write(doc, formatTick(tick), plot.x - 2, y, { ...small, align: 'right', baseline: 'middle' });
  }
  const slot = plot.width / Math.max(1, groups.length);
  groups.forEach((group, index) => {
    const center = plot.x + slot * index + slot / 2;
    const count = Math.max(1, group.values.length);
    const width = Math.min(7, (slot * 0.6 - (count - 1)) / count);
    const groupWidth = count * width + (count - 1);
    group.values.forEach((entry, position) => {
      const x = center - groupWidth / 2 + position * (width + 1);
      const y = yOf(entry.value);
      if (entry.value > 0) {
        // Softly rounded top, square foot on the axis.
        const corner = Math.min(1.2, (plot.bottom - y) / 2);
        bar(doc, x, y, width, plot.bottom - y, entry.color, corner);
        doc.setFillColor(...entry.color);
        doc.rect(x, plot.bottom - corner, width, corner, 'F');
        write(doc, format(entry.value), x + width / 2, y - 1.5, {
          size: 6.5,
          color: entry.color,
          bold: true,
          align: 'center',
        });
      }
    });
    write(doc, group.label, center, plot.bottom + 5, { ...small, align: 'center' });
  });
}

export interface BarRow {
  label: string;
  value: number;
  display: string;
  color: Rgb;
}

/** Horizontal bars, one per row: label, bar on a silver track, value on the right. Returns the height. */
export function bars(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  rows: readonly BarRow[],
  options: { labelWidth: number; valueWidth?: number; rowHeight?: number; track?: Rgb },
): number {
  const rowHeight = options.rowHeight ?? 8;
  const valueWidth = options.valueWidth ?? 20;
  const trackX = x + options.labelWidth + 2;
  const trackWidth = width - options.labelWidth - valueWidth - 4;
  const max = Math.max(1, ...rows.map((row) => row.value));
  rows.forEach((row, index) => {
    const middle = y + index * rowHeight + rowHeight / 2;
    write(
      doc,
      row.label,
      x,
      middle,
      { size: 8.5, color: PDF_COLOR.ink, baseline: 'middle' },
      options.labelWidth,
    );
    bar(doc, trackX, middle - 1.6, trackWidth, 3.2, options.track ?? PDF_COLOR.oat);
    bar(doc, trackX, middle - 1.6, Math.max(3.2, (row.value / max) * trackWidth), 3.2, row.color);
    write(doc, row.display, x + width, middle, {
      size: 8.5,
      color: PDF_COLOR.ink,
      bold: true,
      align: 'right',
      baseline: 'middle',
    });
  });
  return rows.length * rowHeight;
}

/** One bar split into parts, with a legend row per part below. Returns the height. */
export function stack(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  parts: readonly BarRow[],
): number {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  const height = 5;
  bar(doc, x, y, width, height, PDF_COLOR.white);
  if (total > 0) {
    // Clip the parts into the rounded track: draw them square, then round the outer ends.
    let at = x;
    const visible = parts.filter((part) => part.value > 0);
    visible.forEach((part, index) => {
      const partWidth = (part.value / total) * width;
      doc.setFillColor(...part.color);
      const first = index === 0;
      const last = index === visible.length - 1;
      if (first || last) {
        bar(doc, at, y, partWidth, height, part.color);
        const squareFrom = first && !last ? at + partWidth / 2 : at;
        const squareTo = last && !first ? at + partWidth / 2 : at + partWidth;
        if (!(first && last)) {
          doc.rect(squareFrom, y, squareTo - squareFrom, height, 'F');
        }
      } else {
        doc.rect(at, y, partWidth, height, 'F');
      }
      at += partWidth;
    });
  }
  const rowHeight = 7;
  parts.forEach((part, index) => {
    const middle = y + height + 4 + index * rowHeight + rowHeight / 2;
    doc.setFillColor(...part.color);
    doc.circle(x + 1.3, middle, 1.3, 'F');
    write(doc, part.label, x + 4.5, middle, {
      size: 8.5,
      color: PDF_COLOR.ink,
      baseline: 'middle',
    });
    write(doc, part.display, x + width, middle, {
      size: 8.5,
      color: PDF_COLOR.ink,
      bold: true,
      align: 'right',
      baseline: 'middle',
    });
  });
  return height + 4 + parts.length * rowHeight;
}

/** A small rounded label, right-aligned at `right`. Returns its width. */
export function pill(
  doc: jsPDF,
  value: string,
  right: number,
  middle: number,
  colors: { text: Rgb; fill: Rgb },
): number {
  const style: TextStyle = { size: 7.5, color: colors.text, bold: true };
  const width = measure(doc, value, style) + 5;
  card(doc, right - width, middle - 2.6, width, 5.2, colors.fill, 2.6);
  write(doc, value, right - width / 2, middle, { ...style, align: 'center', baseline: 'middle' });
  return width;
}
