import { describe, expect, it, vi } from 'vitest';
import { looksLikeReceipt, readPhoto, type PhotoReaders } from './read-photo';

const RECEIPT = `MIGROS
M-Budget Vollmilch UHT        1.25 1
Gruyère AOC 250g            2x 4.20  8.40 1
TOTAL                         9.65`;

const photo = new Blob(['x'], { type: 'image/jpeg' });

function readers(block: string, sparse = '', code: string | null = null) {
  return {
    readText: vi.fn((_file: Blob, mode: 'block' | 'sparse') =>
      Promise.resolve(mode === 'block' ? block : sparse),
    ),
    readCode: vi.fn(() => Promise.resolve(code)),
  } satisfies PhotoReaders;
}

describe('readPhoto (ADR-0068)', () => {
  it('sees a receipt and reads it only once', async () => {
    const fake = readers(RECEIPT);
    expect(await readPhoto(photo, fake)).toEqual({ kind: 'receipt', text: RECEIPT });
    expect(fake.readText).toHaveBeenCalledTimes(1);
    expect(fake.readCode).not.toHaveBeenCalled();
  });

  it('reads a pack as block and as scattered words, with its barcode', async () => {
    const fake = readers('Bio Vollmilch', 'haltbar bis 20.11.2026', '7610200000019');
    expect(await readPhoto(photo, fake)).toEqual({
      kind: 'label',
      text: 'Bio Vollmilch\nhaltbar bis 20.11.2026',
      code: '7610200000019',
    });
  });

  it('treats a failing reader as nothing found', async () => {
    const broken: PhotoReaders = {
      readText: () => Promise.reject(new Error('no model')),
      readCode: () => Promise.reject(new Error('no camera')),
    };
    expect(await readPhoto(photo, broken)).toEqual({ kind: 'label', text: '' });
  });

  it('needs two articles with a price for a receipt', () => {
    expect(looksLikeReceipt(RECEIPT)).toBe(true);
    expect(looksLikeReceipt('Bio Vollmilch\n1 l\nFett 3.90 g')).toBe(false);
  });
});
