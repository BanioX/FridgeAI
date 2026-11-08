import { buildReport, localDate, rappen, type ReportItem } from '@fridgeai/core';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHF_MONEY } from '../../app/money-format';
import { receiptPdf } from './receipt-pdf';
import { receiptSpec, type QuickKind } from './receipt-spec';
import { sampleReport } from './report-sample';

const options = {
  household: 'WG Musterstrasse',
  detail: 'Dieser Monat',
  createdOn: localDate('2026-11-07'),
};

async function bytesOf(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}
/** Pages of a PDF: the page objects stay readable even when the content streams are packed. */
const pageCount = (bytes: Uint8Array) =>
  new TextDecoder('latin1').decode(bytes).match(/\/Type \/Page\b(?!s)/g)?.length ?? 0;

describe('receiptPdf', () => {
  it.each<QuickKind>(['impact', 'expiring', 'wasted', 'fridge', 'freezer', 'pantry'])(
    'draws the %s receipt on one page',
    async (kind) => {
      const spec = receiptSpec(sampleReport(), kind, { money: CHF_MONEY, days: 3 });
      const bytes = await bytesOf(await receiptPdf(spec, options));
      expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
      expect(pageCount(bytes)).toBe(1);
      // `RECEIPT_PDF_OUT=/some/folder pnpm vitest run receipt-pdf` writes them to look at.
      const out = process.env.RECEIPT_PDF_OUT;
      if (out !== undefined && out !== '') {
        writeFileSync(join(out, `quittung-${kind}.pdf`), bytes);
      }
    },
  );

  it('continues a long list on further pieces of paper instead of cutting it off', async () => {
    const items: ReportItem[] = Array.from({ length: 60 }, (_, index) => ({
      name: `Artikel ${String(index + 1)}`,
      categoryId: 'pantry-pasta',
      location: 'pantry',
      quantity: 1,
      unit: 'pcs',
      expiresOn: localDate('2027-01-01'),
      valueRappen: rappen(100),
      valueEstimated: false,
    }));
    const report = buildReport({
      today: localDate('2026-11-07'),
      from: localDate('2026-11-01'),
      to: localDate('2026-11-07'),
      items,
      outcomes: [],
      purchases: [],
    });
    const spec = receiptSpec(report, 'pantry', { money: CHF_MONEY, days: 3 });
    const bytes = await bytesOf(await receiptPdf(spec, options));
    expect(pageCount(bytes)).toBeGreaterThanOrEqual(3);
  });
});
