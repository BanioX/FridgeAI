/**
 * Draws every page of a PDF as a picture, on the device, with the self-hosted pdf.js (ADR-0028),
 * so a report looks the same in the app on iPhone and Android. `width` is the CSS width the pages
 * are shown at; the pictures are sharp for the screen's pixel density.
 */
export async function renderPdfPages(file: Blob, width: number): Promise<string[]> {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const pdf = await task.promise;
    const pages: string[] = [];
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const page = await pdf.getPage(number);
      const scale =
        (width * Math.min(window.devicePixelRatio, 3)) / page.getViewport({ scale: 1 }).width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvas, viewport }).promise;
      pages.push(canvas.toDataURL('image/png'));
    }
    return pages;
  } finally {
    await task.destroy();
  }
}
