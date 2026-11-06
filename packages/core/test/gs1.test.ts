import { describe, expect, it } from 'vitest';
import { localDate } from '../src/dates';
import { expiryFromScan, parseGs1Date, parseScannedCode } from '../src/scan/gs1';

const today = localDate('2026-11-06');
const GS = '\u001d';
// GS1's own example GTIN-14 (valid check digit); product databases use the GTIN-13 without the 0.
const GTIN14 = '09506000134352';
const GTIN13 = '9506000134352';

describe('parseScannedCode: classic barcodes', () => {
  it('reads EAN-13, EAN-8 and UPC-A as GTIN only', () => {
    expect(parseScannedCode('4006381333931', today)).toEqual({
      format: 'gtin',
      data: { gtin: '4006381333931' },
    });
    expect(parseScannedCode('96385074', today)?.data.gtin).toBe('96385074');
    expect(parseScannedCode('036000291452', today)?.data.gtin).toBe('036000291452');
    expect(parseScannedCode(GTIN14, today)?.data.gtin).toBe(GTIN13);
  });

  it('rejects wrong check digits and junk', () => {
    expect(parseScannedCode('4006381333932', today)).toBeNull();
    expect(parseScannedCode('', today)).toBeNull();
    expect(parseScannedCode('hello', today)).toBeNull();
    expect(parseScannedCode('1234567', today)).toBeNull();
  });
});

describe('parseScannedCode: GS1 2D codes with expiry dates', () => {
  it('reads a raw element string (DataMatrix content)', () => {
    expect(parseScannedCode(`01${GTIN14}1726123110ABC123`, today)).toEqual({
      format: 'gs1_element_string',
      data: { gtin: GTIN13, useBy: '2026-12-31', batch: 'ABC123' },
    });
  });

  it('handles symbology prefixes, group separators and net weight', () => {
    const scanned = parseScannedCode(`]d201${GTIN14}15260630` + `10LOT1${GS}3103000750`, today);
    expect(scanned?.data).toEqual({
      gtin: GTIN13,
      bestBefore: '2026-06-30',
      batch: 'LOT1',
      netWeightGrams: 750,
    });
  });

  it('reads the human-readable form with parentheses', () => {
    expect(parseScannedCode(`(01)${GTIN14}(15)270115(10)A1`, today)?.data).toEqual({
      gtin: GTIN13,
      bestBefore: '2027-01-15',
      batch: 'A1',
    });
    expect(parseScannedCode('(01)abc', today)).toBeNull();
    expect(parseScannedCode('(01', today)).toBeNull();
  });

  it('reads GS1 Digital Link URLs (QR codes)', () => {
    expect(
      parseScannedCode(`https://id.gs1.org/01/${GTIN14}/10/ABC123?17=261231&3103=000500`, today),
    ).toEqual({
      format: 'gs1_digital_link',
      data: { gtin: GTIN13, batch: 'ABC123', useBy: '2026-12-31', netWeightGrams: 500 },
    });
    expect(
      parseScannedCode(`https://example.ch/products/gtin/${GTIN14}?15=261120&3153=001000`, today)
        ?.data,
    ).toEqual({ gtin: GTIN13, bestBefore: '2026-11-20', netVolumeMl: 1000 });
    expect(parseScannedCode('https://example.ch/menu', today)).toBeNull();
  });

  it('keeps what it understood when an unknown AI follows', () => {
    expect(parseScannedCode(`01${GTIN14}7003260101120`, today)?.data).toEqual({ gtin: GTIN13 });
  });

  it('ignores impossible dates but keeps the product', () => {
    expect(parseScannedCode(`(01)${GTIN14}(17)261331`, today)?.data).toEqual({ gtin: GTIN13 });
  });

  it('records sell-by, production and packaging dates and serials', () => {
    expect(
      parseScannedCode(`(01)${GTIN14}(11)261101(13)261102(16)261110(21)S9`, today)?.data,
    ).toEqual({
      gtin: GTIN13,
      productionDate: '2026-11-01',
      packagingDate: '2026-11-02',
      sellBy: '2026-11-10',
      serial: 'S9',
    });
  });
});

describe('parseGs1Date', () => {
  it('uses the last day of the month for DD = 00', () => {
    expect(parseGs1Date('270200', today)).toBe('2027-02-28');
    expect(parseGs1Date('280200', today)).toBe('2028-02-29');
  });

  it('applies the GS1 century window', () => {
    expect(parseGs1Date('760101', today)).toBe('2076-01-01');
    expect(parseGs1Date('770101', today)).toBe('1977-01-01');
    expect(parseGs1Date('010101', localDate('2099-06-01'))).toBe('2101-01-01');
  });

  it('rejects malformed values', () => {
    expect(parseGs1Date('2612', today)).toBeNull();
    expect(parseGs1Date('261331', today)).toBeNull();
    expect(parseGs1Date('260231', today)).toBeNull();
  });
});

describe('expiryFromScan', () => {
  it('prefers the safety-relevant use-by date over best-before', () => {
    expect(
      expiryFromScan({ bestBefore: localDate('2026-12-01'), useBy: localDate('2026-11-20') }),
    ).toEqual({ expiresOn: '2026-11-20', kind: 'use_by' });
    expect(expiryFromScan({ bestBefore: localDate('2026-12-01') })).toEqual({
      expiresOn: '2026-12-01',
      kind: 'best_before',
    });
  });

  it('does not treat sell-by or a plain GTIN as an expiry date', () => {
    expect(expiryFromScan({ sellBy: localDate('2026-11-10') })).toBeNull();
    expect(expiryFromScan({})).toBeNull();
  });
});
