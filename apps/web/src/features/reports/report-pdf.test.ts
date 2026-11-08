import { buildReport, localDate, type Report } from '@fridgeai/core';
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { reportPdf } from './report-pdf';
import { sampleReport } from './report-sample';

/** `REPORT_PDF_OUT=/path/bericht.pdf pnpm vitest run report-pdf` writes the sample PDF to look at it. */
async function render(report: Report): Promise<Uint8Array> {
  const blob = await reportPdf(report, {
    household: 'WG Musterstrasse',
    period: 'Juni bis November 2026',
    createdOn: localDate('2026-11-07'),
  });
  return new Uint8Array(await blob.arrayBuffer());
}

describe('reportPdf', () => {
  it('draws a full report as a PDF', async () => {
    const bytes = await render(sampleReport());
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(5_000);
    const out = process.env.REPORT_PDF_OUT;
    if (out !== undefined && out !== '') {
      writeFileSync(out, bytes);
    }
  });

  it('draws an empty report without failing', async () => {
    const empty = buildReport({
      today: localDate('2026-11-07'),
      from: localDate('2026-11-01'),
      to: localDate('2026-11-07'),
      items: [],
      outcomes: [],
      purchases: [],
    });
    const bytes = await render(empty);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });
});
