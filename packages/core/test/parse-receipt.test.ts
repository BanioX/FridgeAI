import { describe, expect, it } from 'vitest';
import {
  normalizeReceiptLine,
  parseReceiptText,
  type ParsedReceipt,
} from '../src/receipt/parse-receipt';

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
    expect(normalizeReceiptLine('Lidl Plus Rabatt -0,.10')).toBe('Lidl Plus Rabatt -0.10');
  });

  it('reads a minus that OCR saw as a quote or tilde, but only right before an amount', () => {
    expect(normalizeReceiptLine('Lidl Plus Rabatt „0,24')).toBe('Lidl Plus Rabatt -0.24');
    expect(normalizeReceiptLine('Lidl Plus Rabatt ‚0.22')).toBe('Lidl Plus Rabatt -0.22');
    expect(normalizeReceiptLine('Lidl Plus Rabatt ~0,05')).toBe('Lidl Plus Rabatt -0.05');
    expect(normalizeReceiptLine('Kaffee „Crema“ 4.50 A')).toBe('Kaffee „Crema“ 4.50 A');
    expect(normalizeReceiptLine('Wasser "1.5l" 0.95 A')).toBe('Wasser "1.5l" 0.95 A');
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

  it('corrects a look-alike digit and flags any other misread amount', () => {
    // «7.95» for «1.95»: only the milk turning back into 1.95 makes the receipt add up.
    const lookalike = parseReceiptText(COOP.replace('1.95    1.95', '1.95    7.95'));
    expect(lookalike.lines[0]?.priceRappen).toBe(195);
    expect(lookalike.sumCheck).toBe('ok');
    // «4.95» is no look-alike of «1.95»: the review shows the difference.
    const misread = parseReceiptText(COOP.replace('1.95    1.95', '1.95    4.95'));
    expect(misread.sumCheck).toBe('mismatch');
    expect(misread.computedTotalRappen - (misread.totalRappen ?? 0)).toBe(300);
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

// Layouts of real Coop and Migros PDFs and the Lidl app (ADR-0027), with invented content.
const COOP_PDF = `
                                         Musterstadt Zentrum
                               07.11.26 17:12 00123 00456789 001 0001234
Artikel                                        Menge    Preis   Aktion          Total   Zusatz
Semmeli 80G                                    4.0      0.70                     2.80   0   A
Coop Naturaplan Joghurt Mocca 180g             2.0      0.95    0.80             1.60   0   A
Coop Pouletbrust 2St. ca. 330g                 0.312    10.40   8.30             8.30   0   A
Bananen                                        0.734    2.90                     2.13   0   A
Naturaplan Bio Coconutwater 1L                 1.0      3.95                     3.95   0   A
Oecoplan Papiertasche                          1.0      0.40                     0.40   1 # A
Total CHF                                                                    19.18
Mastercard                                                                     19.18
GR                                                 MWST%        TOTAL          MWST
1                                                    8.10         0.40          0.03
0                                                    2.60        18.78          0.48
`;

const MIGROS_PDF = `
                   GENOSSENSCHAFT MIGROS MUSTERLAND
                        M Musterstadt Bahnhof
Artikelbezeichnung           Menge       Preis    Gespart    Total      #
Plastiksack             1        0.05            0.05 2
Mini-Laugen Gruyère     2        1.95    0.60    3.30 S1
M-Budget Vollmilch      1        1.25            1.25 1
Rüebli                  0.860    2.40            2.06 1
Volvic Bio Orange 75cl 1         1.95            1.95 1
--------------------------------------------------------
Sie sparen total                                   0.60
Total CHF                                                    8.61
Visa                                            8.61
        21.10.2026                       16:04
Gr               Satz             Total             MWST
1                2.60 %            8.56             0.22
2                8.10 %            0.05             0.00
`;

const LIDL_APP = `
Kundenhotline:
www.lidl.ch/Service & Hilfe
CHF
Nashi Birnen                    3.16 A
  4 x 0.79
    Lidl Plus Rabatt           -0.80
    Lidl Plus Rabatt           -0.10
Fairtrade Bio Bananen           1.96 A
  0.984 kg x 1.99  CHF/kg
    Lidl Plus Rabatt           -0.39
Chickpic                        6.90 A
  2 x 3.45
Wattestäbchen                   1.13 B
------------
Dein Lidl Preis                11.86
=============
Karte                          11.86
A  2.6 % MwSt von     10.80     0.27
B  8.1 % MwSt von      1.05     0.08
29.10.2026                  18:55:31
`;

const rows = (receipt: ParsedReceipt) =>
  receipt.lines.map((line) => [
    line.kind,
    line.name,
    `${String(line.quantity)} ${line.unit}`,
    line.unitPriceRappen,
    line.priceRappen,
    line.discountRappen,
    line.isFood,
  ]);

describe('parseReceiptText with real layouts', () => {
  it('reads a Coop receipt: «Aktion» column, weighed packs, per-kg goods and VAT groups', () => {
    const receipt = parseReceiptText(COOP_PDF);
    expect(receipt).toMatchObject({
      retailer: 'coop',
      storeName: 'Musterstadt Zentrum',
      purchasedOn: '2026-11-07',
      purchasedTime: '17:12',
      totalRappen: 1918,
      sumCheck: 'ok',
    });
    expect(rows(receipt)).toEqual([
      ['item', 'Semmeli 80G', '4 pcs', 70, 280, 0, true],
      ['item', 'Coop Naturaplan Joghurt Mocca 180g', '2 pcs', 95, 190, -30, true],
      ['item', 'Coop Pouletbrust 2St. ca. 330g', '312 g', 3333, 1040, -210, true],
      ['item', 'Bananen', '734 g', 290, 213, 0, true],
      ['item', 'Naturaplan Bio Coconutwater 1L', '1 pcs', 395, 395, 0, true],
      ['bag', 'Oecoplan Papiertasche', '1 pcs', 40, 40, 0, undefined],
    ]);
  });

  it('reads a Migros receipt: «Gespart» column, «S1» codes and non-food by VAT rate', () => {
    const receipt = parseReceiptText(MIGROS_PDF);
    expect(receipt).toMatchObject({
      retailer: 'migros',
      storeName: 'M Musterstadt Bahnhof',
      purchasedOn: '2026-10-21',
      purchasedTime: '16:04',
      sumCheck: 'ok',
    });
    expect(rows(receipt)).toEqual([
      ['bag', 'Plastiksack', '1 pcs', 5, 5, 0, undefined],
      ['item', 'Mini-Laugen Gruyère', '2 pcs', 195, 390, -60, true],
      ['item', 'M-Budget Vollmilch', '1 pcs', 125, 125, 0, true],
      ['item', 'Rüebli', '860 g', 240, 206, 0, true],
      ['item', 'Volvic Bio Orange 75cl', '1 pcs', 195, 195, 0, true],
    ]);
  });

  it('reads a Lidl receipt: quantity and «Lidl Plus Rabatt» below the item', () => {
    const receipt = parseReceiptText(LIDL_APP);
    expect(receipt).toMatchObject({ retailer: 'lidl', purchasedOn: '2026-10-29', sumCheck: 'ok' });
    expect(receipt.storeName).toBeUndefined();
    expect(rows(receipt)).toEqual([
      ['item', 'Nashi Birnen', '4 pcs', 79, 316, -90, true],
      ['item', 'Fairtrade Bio Bananen', '984 g', 199, 196, -39, true],
      ['item', 'Chickpic', '2 pcs', 345, 690, 0, true],
      ['item', 'Wattestäbchen', '1 pcs', undefined, 113, 0, false],
    ]);
  });

  it('counts a Cumulus voucher but never bonus points on a Migros PDF', () => {
    const receipt = parseReceiptText(
      [
        'MIGROS',
        'Artikelbezeichnung Menge Preis Gespart Total #',
        'Quark Nature 2 0.60 1.20 1',
        'Kochbuch 1 19.90 19.90 1',
        'Zwischentotal 21.10',
        'Cumulus Bons',
        'CUMULUS BON 5.- 5.00- 9',
        'Cumulus Bonuspunkte',
        '+3xPkt.Ges.Sort. 63.30',
        'Total CHF 16.10',
      ].join('\n'),
      { fromPdf: true },
    );
    expect(
      receipt.lines.map((line) => [line.kind, line.priceRappen + line.discountRappen]),
    ).toEqual([
      ['item', 120],
      ['item', 1990],
      ['discount', -500],
    ]);
    expect(receipt.sumCheck).toBe('ok');
  });

  it('shares a discount named after articles between them (Coop)', () => {
    const receipt = parseReceiptText(
      [
        'Coop',
        'Konfitüre Kirsche 335G 1.0 4.95 4.95 0 A',
        'Konfitüre Himbeere 335g 1.0 5.50 5.50 0 A',
        'Papiertasche 1.0 0.40 0.40 1 # A',
        'Rabatt Konfitüre -2.10',
        'Total CHF 8.75',
      ].join('\n'),
      { fromPdf: true },
    );
    expect(receipt.lines.map((line) => [line.kind, line.priceRappen, line.discountRappen])).toEqual(
      [
        ['item', 495, -99],
        ['item', 550, -111],
        ['bag', 40, 0],
      ],
    );
    expect(receipt.sumCheck).toBe('ok');
    // Without articles of that name it stays a discount for the whole receipt.
    const other = parseReceiptText(
      'Coop\nBrot 1.0 2.40 2.40 0 A\nPapiertasche 1.0 0.40 0.40 1 # A\nRabatt Konfitüre -0.50\nTotal CHF 2.30',
    );
    expect(other.lines.map((line) => line.kind)).toEqual(['item', 'bag', 'discount']);
  });

  it('flags a misread amount on a Coop PDF, PDF text is never guessed at', () => {
    const receipt = parseReceiptText(
      COOP_PDF.replace('3.95                     3.95', '3.95  8.95'),
      { fromPdf: true },
    );
    expect(receipt.sumCheck).toBe('mismatch');
    expect(receipt.computedTotalRappen - (receipt.totalRappen ?? 0)).toBe(500);
  });
});

describe('parseReceiptText on photos', () => {
  it('trusts «2 x 3.45» over a misread «6.99» above it, but not a different amount', () => {
    const misread = parseReceiptText(
      'Lidl\nChickpic 6.99 A\n2 x 3.45\nKaese 4.49 A\n2 x 1.39\nDein Lidl Preis 11.39',
    );
    expect(misread.lines.map((line) => [line.name, line.quantity, line.priceRappen])).toEqual([
      ['Chickpic', 2, 690],
      ['Kaese', 1, 449],
    ]);
    expect(misread.sumCheck).toBe('ok');
  });

  it('keeps a discount that lost its minus and a misread «-6.13» from becoming wrong prices', () => {
    const receipt = parseReceiptText(
      '® Comm ieh |\nwww.lidl.ch\nGuacamole Chunky 2.49 A\nLidl Plus Rabatt 0.50\nAfter Shave 2.95 B\nLidl Plus Rabatt -6.13\nDein Lidl Preis 4.81',
    );
    expect(receipt.storeName).toBeUndefined();
    expect(receipt.lines.map((line) => [line.name, line.discountRappen])).toEqual([
      ['Guacamole Chunky', -50],
      ['After Shave', -13],
    ]);
    expect(receipt.sumCheck).toBe('ok');
  });

  it('reads a Lidl Plus app screenshot whose minus signs and digits OCR got wrong', () => {
    // Invented articles, with the slips a downscaled app screenshot really produced (13.11.2026).
    const receipt = parseReceiptText(
      [
        'Lidl Lohnt sich.',
        'Joghurt Nature 1.58 A',
        '2 x 0.79',
        'Lidl Plus Rabatt „0,79',
        'Lidl Plus Rabatt -0,.01',
        'Bündnerfleisch 13.05 A',
        '3 x 4.35',
        'Lidl Plus Rabatt „0,24',
        'Kirschen lose 6.50 A',
        '0,504 kg x 12.980 CHF/kg',
        'Lidl Plus Rabatt 0,15',
        'Mix-it Joghurt 1.988 A',
        'Lidl Plus Rabatt -0.03',
        '------------',
        'Dein Lidl Preis 21.89',
        'Karte 21.89',
        'A 2.6 % MwSt von 21.89 0.55',
        'Eingelöste Coupons',
        '-5 Fr.',
        'Gratis',
        '-24%',
        '+589 Lidl Punkte',
      ].join('\n'),
    );
    expect(receipt.sumCheck).toBe('ok');
    expect(rows(receipt)).toEqual([
      ['item', 'Joghurt Nature', '2 pcs', 79, 158, -80, true],
      ['item', 'Bündnerfleisch', '3 pcs', 435, 1305, -24, true],
      ['item', 'Kirschen lose', '504 g', 1290, 650, -15, true],
      // «1.988»: of «1.88» and «1.98» only the second makes the receipt add up.
      ['item', 'Mix-it Joghurt', '1 pcs', undefined, 198, -3, true],
    ]);
  });

  it('reads a total, prices and a VAT group that OCR got wrong on a Lidl Plus screenshot', () => {
    // Invented articles, with the slips a small app screenshot really produced (13.11.2026).
    const receipt = parseReceiptText(
      [
        'Leise',
        'www.lidl.ch',
        'Apfel Gala 2.99 A',
        'Lidl Plus Rabatt -0.13',
        'Quark Nature 9.99 A',
        'Lidl Plus Rabatt -0.04',
        'Joghurt Mocca 9.99 A',
        'Lidl Plus Rabatt 0.04',
        'Duschgel Sport 2.95 8',
        'Lidl Plus Rabatt -0,.13',
        'Dein Lidl Preis 75.58',
        'Karte 7.58',
        'Total-EFT CHF: 7.58',
        'A 2.6 % MwSt von 4.76 0.12',
        'B 8.1 % MwSt von 2.82 0.21',
        'Einkauf getätigt in',
        'Musterstadt (Fil.Nr. 0001)',
      ].join('\n'),
    );
    // «75.58» has a digit too many: «Karte» and «Total-EFT» repeat the total as 7.58.
    expect(receipt.totalRappen).toBe(758);
    expect(receipt.sumCheck).toBe('ok');
    expect(rows(receipt)).toEqual([
      ['item', 'Apfel Gala', '1 pcs', undefined, 299, -13, true],
      // «9.99» twice for «0.99»: the only two look-alikes that make the receipt add up.
      ['item', 'Quark Nature', '1 pcs', undefined, 99, -4, true],
      ['item', 'Joghurt Mocca', '1 pcs', undefined, 99, -4, true],
      // VAT group «B» read as «8»: still not food.
      ['item', 'Duschgel Sport', '1 pcs', undefined, 295, -13, false],
    ]);
    // The branch comes from the app, not from the logo that OCR read as «Leise».
    expect(receipt.storeName).toBe('Musterstadt');
    expect(
      parseReceiptText('Leise\nwww.lidl.ch\nBrot 2.49 A\nDein Lidl Preis 2.49').storeName,
    ).toBe(undefined);
  });

  it('reads weighed goods, a rounding and a point read as a colon on a screenshot', () => {
    const text = [
      'Lidl',
      // «0.744 kg» and «0.89» both read with a 9 in front: only that pair agrees.
      'Äpfel lose 9.89 A',
      '9.744 kg x 1.19 CHF/kg',
      'Popkorn süss 1:25 A',
      'Zwischensumme 2.14',
      'Rundung -8,.04',
      'Dein Lidl Preis 2.10',
    ].join('\n');
    const receipt = parseReceiptText(text);
    expect(
      receipt.lines.map((line) => [line.kind, line.name, line.quantity, line.priceRappen]),
    ).toEqual([
      ['item', 'Äpfel lose', 744, 89],
      ['item', 'Popkorn süss', 1, 125],
      // A rounding is under 10 Rappen and never an article.
      ['discount', 'Rundung', 1, -4],
    ]);
    expect(receipt.sumCheck).toBe('ok');
    // The same text from a PDF is taken as printed: the review shows the difference.
    const pdf = parseReceiptText(text, { fromPdf: true });
    expect(pdf.lines.map((line) => line.priceRappen)).toEqual([989, 125, -804]);
    expect(pdf.sumCheck).toBe('mismatch');
    // A rounding up is part of the sum, not an article.
    const up = parseReceiptText(
      'Lidl\nBrot 2.48 A\nZwischensumme 2.48\nRundung 0.02\nDein Lidl Preis 2.50',
    );
    expect(up.lines.map((line) => [line.kind, line.priceRappen])).toEqual([
      ['item', 248],
      ['discount', 2],
    ]);
    expect(up.sumCheck).toBe('ok');
  });

  it('leaves a look-alike to the review when it is not the only way to add up', () => {
    // Either «9.99» could be 0.99: no guess, the sum check shows the difference.
    const receipt = parseReceiptText('Lidl\nQuark 9.99 A\nJoghurt 9.99 A\nDein Lidl Preis 10.98');
    expect(receipt.lines.map((line) => line.priceRappen)).toEqual([999, 999]);
    expect(receipt.sumCheck).toBe('mismatch');
    // A total that disagrees with its repeat by more than one slip stays as printed.
    const far = parseReceiptText('Lidl\nBrot 2.49 A\nDein Lidl Preis 2.49\nKarte 3.50');
    expect(far.totalRappen).toBe(249);
  });

  it('keeps the first reading of a digit too many when no reading fits the total', () => {
    const receipt = parseReceiptText('Lidl\nMix-it Joghurt 1.988 A\nDein Lidl Preis 5.00');
    expect(receipt.lines.map((line) => [line.name, line.priceRappen])).toEqual([
      ['Mix-it Joghurt', 188],
    ]);
    expect(receipt.sumCheck).toBe('mismatch');
  });

  it('keeps the name clean when quantity and price do not fit the amount', () => {
    const receipt = parseReceiptText('Coop\nSkyr Heidelbeere 1.0 0.99 9.99 0 A\nTotal CHF 1.98');
    expect(receipt.lines.map((line) => [line.name, line.quantity, line.priceRappen])).toEqual([
      ['Skyr Heidelbeere', 1, 999],
    ]);
    expect(receipt.sumCheck).toBe('mismatch');
  });
});
