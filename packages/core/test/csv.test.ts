import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from '../src/export/csv';

describe('csv', () => {
  it('quotes separators, quotes and line breaks', () => {
    expect(csvCell('Milch; Bio')).toBe('"Milch; Bio"');
    expect(csvCell('Sagt "Hallo"')).toBe('"Sagt ""Hallo"""');
    expect(csvCell('zwei\nZeilen')).toBe('"zwei\nZeilen"');
    expect(csvCell(undefined)).toBe('');
    expect(csvCell(1.5)).toBe('1.5');
  });

  it('defuses formulas but keeps negative numbers', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell('+41 79')).toBe("'+41 79");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvCell('-3.95')).toBe('-3.95');
    expect(csvCell(-2)).toBe('-2');
  });

  it('writes a file Excel in Switzerland opens with umlauts', () => {
    expect(
      toCsv(
        ['Name', 'Menge'],
        [
          ['Rüebli', 3],
          ['Käse', undefined],
        ],
      ),
    ).toBe('\uFEFFName;Menge\r\nRüebli;3\r\nKäse;\r\n');
  });
});
