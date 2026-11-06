/** Codes on food packs: EAN/UPC on every product, QR and GS1 DataMatrix (can carry the date). */
export const SCAN_FORMATS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'qr_code',
  'data_matrix',
] as const;

export interface CodeReader {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
}

let reader: Promise<CodeReader> | null = null;

/**
 * ZXing as WebAssembly (the same on iPhone and Android; Safari has no native BarcodeDetector).
 * Loaded only when someone scans, and served from our own origin: no CDN, works offline (PWA cache).
 */
export function loadCodeReader(): Promise<CodeReader> {
  reader ??= Promise.all([
    import('barcode-detector/ponyfill'),
    import('zxing-wasm/reader/zxing_reader.wasm?url'),
  ]).then(([{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }]) => {
    prepareZXingModule({
      overrides: {
        locateFile: (path: string, prefix: string) =>
          path.endsWith('.wasm') ? wasmUrl : prefix + path,
      },
    });
    return new BarcodeDetector({ formats: [...SCAN_FORMATS] });
  });
  return reader;
}
