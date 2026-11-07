import { describe, expect, it } from 'vitest';
import { normalizeReceiptLine, parseReceiptText } from '../src/receipt/parse-receipt';

// Synthetic receipts in the usual Swiss layouts (ADR-0027). Invented stores and products only.
const COOP = `
Coop Supermarkt Musterstadt
Artikel                Menge  Preis   Total
Naturaplan Bio Vollmilch   1   1.95    1.95
Butterweggli 4 Stück       2   2.40    4.80
Aktion 20%                             -0.96
Bananen
0.734 kg x 2.90 /kg                    2.13
Rivella Rot 1.5l           1   2.50    2.50
Pfand PET                  1   0.00    0.00
Tragtasche Papier                      0.30
Total CHF                             10.72
Mastercard                            10.72
MWST 2.6%  10.42  0.27
07.11.26 18:42
`;

const MIGROS = `
MIGROS
Genossenschaft Migros Musterland
M-Budget Vollmilch UHT        1.25 1
Gruyère AOC 250g            2x 4.20  8.40 1
AKT. 20%                      -1.68 1
Rüebli
1,020 kg à 2.40              2.45 1
Zwischensumme                10.42
Einkaufsrabatt 5%            -0.52
TOTAL                         9.90
TWINT                         9.90
Datum: 06.11.2026 08:05:13
`;

describe('normalizeReceiptLine', () => {
  it('fixes the usual OCR slips inside amounts and leaves words alone', () => {
    expect(normalizeReceiptLine('Joghurt   l.95')).toBe('Joghurt 1.95');
    expect(normalizeReceiptLine('Käse 1O,50')).toBe('Käse 10.50');
    expect(normalizeReceiptLine('Rabatt  0.80–')).toBe('Rabatt 0.80-');
    expect(normalizeReceiptLine('Brot 3 .95')).toBe('Brot 3.95');
    expect(normalizeReceiptLine('Olivenöl Bio 1.5l')).toBe('Olivenöl Bio 1.5l');
  });
});

describe('parseReceiptText', () => {
  it('reads a Coop receipt: quantities, weight, discount, deposit, bag and total', () => {
    const receipt = parseReceiptText(COOP);
    expect(receipt.retailer).toBe('coop');
    expect(receipt.storeName).toBe('Coop Supermarkt Musterstadt');
    expect(receipt.purchasedOn).toBe('2026-11-07');
    expect(receipt.purchasedTime).toBe('18:42');
    expect(receipt.lines.map((line) => [line.kind, line.name, line.priceRappen])).toEqual([
      ['item', 'Naturaplan Bio Vollmilch', 195],
      ['item', 'Butterweggli 4 Stück', 480],
      ['item', 'Bananen', 213],
      ['item', 'Rivella Rot 1.5l', 250],
      ['deposit', 'Pfand PET', 0],
      ['bag', 'Tragtasche Papier', 30],
    ]);
    const [, weggli, bananas] = receipt.lines;
    expect(weggli).toMatchObject({
      quantity: 2,
      unit: 'pcs',
      unitPriceRappen: 240,
      discountRappen: -96,
    });
    expect(bananas).toMatchObject({ quantity: 734, unit: 'g', unitPriceRappen: 290 });
    expect(receipt.totalRappen).toBe(1072);
    expect(receipt.computedTotalRappen).toBe(1072);
    expect(receipt.sumCheck).toBe('ok');
  });

  it('reads a Migros receipt with VAT codes, a receipt-wide discount and «à» weights', () => {
    const receipt = parseReceiptText(MIGROS);
    expect(receipt.retailer).toBe('migros');
    expect(receipt.purchasedOn).toBe('2026-11-06');
    expect(receipt.purchasedTime).toBe('08:05');
    expect(
      receipt.lines.map((line) => [line.kind, line.name, line.priceRappen, line.discountRappen]),
    ).toEqual([
      ['item', 'M-Budget Vollmilch UHT', 125, 0],
      ['item', 'Gruyère AOC 250g', 840, -168],
      ['item', 'Rüebli', 245, 0],
      ['discount', 'Einkaufsrabatt 5%', -52, 0],
    ]);
    expect(receipt.lines[2]).toMatchObject({ quantity: 1020, unit: 'g', unitPriceRappen: 240 });
    expect(receipt.sumCheck).toBe('ok');
  });

  it('flags a misread amount instead of trusting it', () => {
    const misread = COOP.replace('1.95    1.95', '1.95    7.95');
    const receipt = parseReceiptText(misread);
    expect(receipt.sumCheck).toBe('mismatch');
    expect(receipt.computedTotalRappen - (receipt.totalRappen ?? 0)).toBe(600);
  });

  it('copes with Aldi, Lidl and Denner, unknown shops and receipts without a total', () => {
    expect(parseReceiptText('ALDI SUISSE\nMilch 1.15\nSumme 1.15').retailer).toBe('aldi');
    expect(parseReceiptText('Lidl Schweiz\nBrot 2.49\nZu bezahlen 2.49').sumCheck).toBe('ok');
    expect(parseReceiptText('DENNER\nKaffee 4.95').sumCheck).toBe('no-total');
    const unknown = parseReceiptText('Hofladen\nEier 6 Stück 5.40\nTotal 5.40');
    expect(unknown.retailer).toBe('other');
    expect(unknown.purchasedOn).toBeUndefined();
    expect(parseReceiptText('').lines).toEqual([]);
  });

  it('does not take a product named «Bar» or «Netto» for payment or tax', () => {
    const receipt = parseReceiptText('Coop\nProtein Bar 2.20\nNetto Sauce 1.90\nTotal 4.10');
    expect(receipt.lines.map((line) => line.name)).toEqual(['Protein Bar', 'Netto Sauce']);
    expect(receipt.sumCheck).toBe('ok');
  });
});
