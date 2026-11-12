import { buildReport, localDate, rappen, type Report } from '@fridgeai/core';
import { writeFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ownerMark, write } from './pdf-kit';
import type * as kit from './pdf-kit';
import { reportPdf } from './report-pdf';
import { sampleFootprint, sampleReport } from './report-sample';

vi.mock('./pdf-kit', async (importActual) => {
  const actual = await importActual<typeof kit>();
  return { ...actual, write: vi.fn(actual.write), ownerMark: vi.fn(actual.ownerMark) };
});

/** Every text the report wrote so far. */
const written = () => vi.mocked(write).mock.calls.map(([, value]) => value);

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
  beforeEach(() => {
    vi.mocked(write).mockClear();
    vi.mocked(ownerMark).mockClear();
  });

  it('draws a full report as a PDF', async () => {
    const bytes = await render(sampleReport());
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(5_000);
    const out = process.env.REPORT_PDF_OUT;
    if (out !== undefined && out !== '') {
      writeFileSync(out, bytes);
    }
  });

  it('adds the Klimabilanz section with the CC BY 4.0 source when a footprint is given', async () => {
    const blob = await reportPdf(sampleReport(), {
      household: 'WG Musterstrasse',
      period: 'Juni bis November 2026',
      createdOn: localDate('2026-11-07'),
      footprint: sampleFootprint(),
    });
    expect(blob.size).toBeGreaterThan(5_000);
    const texts = written();
    expect(texts).toContain('Klimabilanz');
    expect(texts).toContain('21,8');
    expect(texts.some((value) => value.includes('CC BY 4.0'))).toBe(true);
    expect(texts.some((value) => value.includes('Kehricht'))).toBe(true);
  });

  it('leaves the Klimabilanz out without a footprint or with nothing rescued', async () => {
    await render(sampleReport());
    const zero = sampleFootprint();
    await reportPdf(sampleReport(), {
      household: 'WG',
      period: 'x',
      createdOn: localDate('2026-11-07'),
      footprint: { ...zero, rescued: { ...zero.rescued, count: 0 } },
    });
    const texts = written();
    expect(texts).not.toContain('Klimabilanz');
    expect(texts.some((value) => value.includes('CC BY 4.0'))).toBe(false);
  });

  it('prints the household name given in the masthead', async () => {
    await render(sampleReport());
    const texts = written();
    expect(texts).toContain('WG Musterstrasse · Juni bis November 2026');
  });

  it('draws the shop letter of items from a receipt', async () => {
    const report = sampleReport();
    expect(report.fridge.items.some((item) => item.retailer === 'coop')).toBe(true);
    const without = {
      ...report,
      fridge: {
        ...report.fridge,
        items: report.fridge.items.map((item) => ({ ...item, retailer: undefined })),
        urgent: report.fridge.urgent.map((item) => ({ ...item, retailer: undefined })),
      },
    };
    // The shop letter and the shop in the detail line make the page content longer.
    const [with_, plain] = [await render(report), await render(without)];
    expect(new TextDecoder().decode(with_.slice(0, 5))).toBe('%PDF-');
    expect(with_.length).toBeGreaterThan(plain.length);
  });

  it('says in «Was auffällt» how many ingredients were processed, only when there are some', async () => {
    await render(sampleReport());
    expect(written()).toContain('3 Zutaten verarbeitet, CHF 5.60 wanderten weiter.');
    vi.mocked(write).mockClear();
    const report = sampleReport();
    await render({
      ...report,
      impact: { ...report.impact, processed: { count: 0, valueRappen: rappen(0) } },
    });
    expect(written().some((value) => value.includes('verarbeitet'))).toBe(false);
  });

  it('writes the spot after the name, the owner mark and the origin tag', async () => {
    await render(sampleReport());
    expect(written()).toContain('· Türfach');
    expect(vi.mocked(ownerMark).mock.calls.map(([, initials]) => initials)).toContain('MK');
    expect(written().some((value) => value.includes('Selbst gemacht'))).toBe(true);
    expect(written().some((value) => value.includes('Reste'))).toBe(true);
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
