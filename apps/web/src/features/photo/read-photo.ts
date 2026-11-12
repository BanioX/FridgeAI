import { parseReceiptText } from '@fridgeai/core';
import { readImageText } from '../receipts/read-image';
import { loadCodeReader } from '../scan/barcode';

/** What «Foto aufnehmen» saw: a receipt, or a pack with its text and maybe a barcode. */
export type PhotoReading =
  { kind: 'receipt'; text: string } | { kind: 'label'; text: string; code?: string };

export interface PhotoReaders {
  readText: (file: Blob, mode: 'block' | 'sparse') => Promise<string>;
  readCode: (file: Blob) => Promise<string | null>;
}

/** Two articles with a price: a receipt. A pack's nutrition table has no prices. */
export function looksLikeReceipt(text: string): boolean {
  return parseReceiptText(text).lines.filter((line) => line.kind === 'item').length >= 2;
}

/**
 * Reads the photo on the device (ADR-0068). First as one block, the way a receipt is read; if it
 * is no receipt, once more as scattered words, the way the text on a pack stands, and for a
 * barcode. A reader that fails counts as «nothing found»: the person types instead.
 */
export async function readPhoto(file: Blob, readers: PhotoReaders): Promise<PhotoReading> {
  const block = await readers.readText(file, 'block').catch(() => '');
  if (looksLikeReceipt(block)) {
    return { kind: 'receipt', text: block };
  }
  const [sparse, code] = await Promise.all([
    readers.readText(file, 'sparse').catch(() => ''),
    readers.readCode(file).catch(() => null),
  ]);
  const text = [block, sparse].filter((part) => part.trim() !== '').join('\n');
  return { kind: 'label', text, ...(code === null ? {} : { code }) };
}

export const deviceReaders: PhotoReaders = {
  readText: (file, mode) => readImageText(file, { mode }),
  async readCode(file) {
    const bitmap = await createImageBitmap(file);
    try {
      const [code] = await (await loadCodeReader()).detect(bitmap);
      return code?.rawValue ?? null;
    } finally {
      bitmap.close();
    }
  },
};
