import { describe, expect, it } from 'vitest';
import { pdfTextToLines, type PdfTextItem } from '../src/receipt/pdf-lines';

const piece = (text: string, x: number, y: number, width = text.length * 5): PdfTextItem => ({
  text,
  x,
  y,
  width,
});

describe('pdfTextToLines', () => {
  it('rebuilds receipt lines from column pieces, top to bottom, page after page', () => {
    const page1 = [
      piece('1.40', 300, 700),
      piece('Semmeli 80G', 20, 700.8),
      piece('2.0', 200, 699.5),
      piece('Total CHF', 20, 650),
      piece('Schwerzenbach', 120, 760),
      piece('Chimli', 190, 760),
      piece('41.55', 300, 650),
    ];
    const page2 = [piece('Vielen Dank', 20, 700)];
    expect(pdfTextToLines([page1, page2])).toBe(
      'Schwerzenbach Chimli\nSemmeli 80G 2.0 1.40\nTotal CHF 41.55\nVielen Dank',
    );
  });

  it('joins pieces of one word and skips empty pieces', () => {
    const items = [piece('Gruy', 20, 500, 20), piece('ère', 40, 500, 15), piece(' ', 60, 500)];
    expect(pdfTextToLines([items])).toBe('Gruyère');
    expect(pdfTextToLines([])).toBe('');
  });
});
