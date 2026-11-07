import { pdfTextToLines, type PdfTextItem } from '@fridgeai/core';

/** Receipts are short; a longer PDF is not a receipt. */
const MAX_PAGES = 10;

/**
 * Reads the text of a receipt PDF on the device (ADR-0028) with pdf.js. pdf.js and its worker are
 * self-hosted and only loaded when a PDF is chosen; nothing leaves the device. Returns '' for a PDF
 * without text (a scanned picture).
 */
export async function readPdfText(data: ArrayBuffer): Promise<string> {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  // No font loading: only the text is needed.
  const task = pdfjs.getDocument({ data: new Uint8Array(data), disableFontFace: true });
  try {
    const pdf = await task.promise;
    const pages: PdfTextItem[][] = [];
    for (let number = 1; number <= Math.min(pdf.numPages, MAX_PAGES); number += 1) {
      const page = await pdf.getPage(number);
      const { items } = await page.getTextContent();
      pages.push(
        items.flatMap((item) => {
          if (!('str' in item)) {
            return [];
          }
          const [, , , , x = 0, y = 0] = item.transform as number[];
          return [{ text: item.str, x, y, width: item.width }];
        }),
      );
    }
    return pdfTextToLines(pages);
  } finally {
    await task.destroy();
  }
}
