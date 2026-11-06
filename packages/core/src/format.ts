/** Groups the integer part with the Swiss thousands separator (’). */
export function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '’');
}

/**
 * Formats a number the Swiss way (ADR-0018): decimal point like in francs, ’ between thousands,
 * at most `digits` decimals without trailing zeros, e.g. `1.5`, `0.25`, `1’250`. Deterministic and
 * independent of the runtime's Intl data, like `formatChf`. `group: false` gives a plain number for
 * input fields (`1250`).
 */
export function formatDecimal(
  value: number,
  options: { digits?: number; group?: boolean } = {},
): string {
  const { digits = 2, group = true } = options;
  const factor = 10 ** digits;
  const rounded = Math.round(Math.abs(value) * factor);
  const sign = value < 0 && rounded !== 0 ? '-' : '';
  const whole = String(Math.trunc(rounded / factor));
  const fraction = String(rounded % factor)
    .padStart(digits, '0')
    .replace(/0+$/, '');
  return `${sign}${group ? groupThousands(whole) : whole}${fraction === '' ? '' : `.${fraction}`}`;
}
