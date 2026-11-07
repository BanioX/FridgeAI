import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { gunzipSync } from 'node:zlib';
import type { Plugin } from 'vite';

/** Where the app serves the German OCR model; `read-image.ts` points tesseract.js here. */
const FILE = 'ocr/deu.traineddata';

/**
 * Serves the German OCR model (tessdata «best_int», Apache-2.0) from the app itself, never from a
 * CDN (CLAUDE.md, ADR-0028). Unpacked, so Cloudflare can compress it in transit without tesseract.js
 * unpacking it twice. Not precached: tesseract.js keeps it on the device after the first photo.
 */
export function ocrLanguage(): Plugin {
  const model = () =>
    gunzipSync(
      readFileSync(
        createRequire(import.meta.url).resolve(
          '@tesseract.js-data/deu/4.0.0_best_int/deu.traineddata.gz',
        ),
      ),
    );
  return {
    name: 'fridgeai-ocr-language',
    configureServer(server) {
      server.middlewares.use(`/${FILE}`, (_request, response) => {
        response.setHeader('Content-Type', 'application/octet-stream');
        response.end(model());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: FILE, source: model() });
    },
  };
}
