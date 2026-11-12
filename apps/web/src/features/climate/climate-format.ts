/**
 * Numbers for the Klimabilanz the Swiss way (ADR-0057): decimal comma, apostrophe between thousands
 * («1’250 l», «2,4 kg»). Written by hand, like the money format, so it does not depend on the
 * runtime's Intl data.
 */

const GROUP = '’';

/** 1250 → «1’250», 2.4 → «2,4»; `digits` decimals at most, trailing zeros kept off. */
export function formatNumber(value: number, digits = 0): string {
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  const [whole = '0', fraction] = Math.abs(rounded).toFixed(digits).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP);
  const sign = rounded < 0 ? '-' : '';
  return fraction === undefined || Number(fraction) === 0
    ? `${sign}${grouped}`
    : `${sign}${grouped},${fraction}`;
}

/** A value and its unit, e.g. {value: '2,4', unit: 'kg'}, for tiles that show them apart. */
export interface Quantity {
  value: string;
  unit: string;
}

/** Grams as «850 g» below a kilogram, else kilograms with one decimal. */
export function weight(grams: number, label = ''): Quantity {
  const suffix = label === '' ? '' : ` ${label}`;
  return grams < 1000
    ? { value: formatNumber(grams), unit: `g${suffix}` }
    : { value: formatNumber(grams / 1000, 1), unit: `kg${suffix}` };
}

export const food = (grams: number): Quantity => weight(grams);
export const co2e = (co2eGrams: number): Quantity => weight(co2eGrams, 'CO₂e');
export const water = (litres: number): Quantity => ({ value: formatNumber(litres), unit: 'l' });
export const land = (m2: number): Quantity => ({ value: formatNumber(m2, 1), unit: 'm²' });

/** «2,4 kg» as one text. */
export const text = ({ value, unit }: Quantity): string => `${value} ${unit}`;

/** The PDF fonts have no subscript two: «CO₂e» is drawn as «CO2e». */
export const pdfSafe = (value: string): string => value.replaceAll('₂', '2');

/** Share of the rescued weight that rests on an estimate, as whole percent; null when none. */
export const estimatedPercent = (share: number): number | null =>
  share === 0 ? null : Math.max(1, Math.round(100 * share));
