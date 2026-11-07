/** iPhones refuse canvases above about 16.7 million pixels. */
const MAX_PIXELS = 16_000_000;
/** Tesseract reads best when a receipt is roughly this wide. */
const TARGET_WIDTH = 1800;

/** Upright (EXIF), and small screenshots enlarged so the digits are big enough to read. */
async function prepare(file: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(
    3,
    Math.max(1, TARGET_WIDTH / bitmap.width),
    Math.sqrt(MAX_PIXELS / (bitmap.width * bitmap.height)),
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('No canvas available');
  }
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

/**
 * Reads the text of a receipt photo or screenshot on the device (ADR-0028) with tesseract.js:
 * engine, worker and German model are self-hosted and loaded only when a picture is chosen. The
 * picture never leaves the device and is not stored.
 */
export async function readImageText(file: Blob): Promise<string> {
  const [{ createWorker, OEM, PSM }, worker, simdCore, plainCore] = await Promise.all([
    import('tesseract.js'),
    import('tesseract.js/dist/worker.min.js?url'),
    import('tesseract.js-core/tesseract-core-simd-lstm.wasm.js?url'),
    import('tesseract.js-core/tesseract-core-lstm.wasm.js?url'),
  ]);
  const start = (corePath: string) =>
    createWorker('deu', OEM.LSTM_ONLY, {
      workerPath: worker.default,
      corePath,
      langPath: `${import.meta.env.BASE_URL}ocr`,
      gzip: false,
      // A blob worker would need `worker-src blob:` in the CSP.
      workerBlobURL: false,
    });
  // Older devices without WebAssembly SIMD take the slower engine.
  const ocr = await start(simdCore.default).catch(() => start(plainCore.default));
  try {
    await ocr.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const { data } = await ocr.recognize(await prepare(file));
    return data.text;
  } finally {
    await ocr.terminate();
  }
}
