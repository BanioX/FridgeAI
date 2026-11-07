/** A piece of text on a PDF page as pdf.js reports it: points, `y` grows upwards. */
export interface PdfTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
}

/** Pieces whose baselines differ by at most this many points belong to one line. */
const SAME_LINE = 2;
/** A gap wider than this (points) between two pieces is a space. */
const SPACE = 1;

/**
 * Puts the text pieces of a receipt PDF back into lines (ADR-0028): same baseline = one line,
 * read left to right, with a space where two pieces do not touch; pages follow each other. The
 * Coop and Migros PDFs print every column as its own piece.
 */
export function pdfTextToLines(pages: readonly (readonly PdfTextItem[])[]): string {
  const lines: string[] = [];
  for (const items of pages) {
    const rows: { y: number; items: PdfTextItem[] }[] = [];
    for (const item of items) {
      if (item.text.trim() === '') {
        continue;
      }
      const row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= SAME_LINE);
      if (row === undefined) {
        rows.push({ y: item.y, items: [item] });
      } else {
        row.items.push(item);
      }
    }
    rows.sort((a, b) => b.y - a.y);
    for (const row of rows) {
      let line = '';
      let end = Number.NEGATIVE_INFINITY;
      for (const item of [...row.items].sort((a, b) => a.x - b.x)) {
        line += line !== '' && item.x - end > SPACE ? ` ${item.text}` : item.text;
        end = item.x + item.width;
      }
      lines.push(line.trim());
    }
  }
  return lines.join('\n');
}
