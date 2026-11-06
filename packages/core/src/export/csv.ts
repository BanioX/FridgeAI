/** Tells Excel the file is UTF-8, so umlauts survive. */
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

/** Cells a spreadsheet would run as a formula (CSV injection), unless they are plain numbers. */
const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^-?\d+(?:\.\d+)?$/;

/** One cell: formulas defused with a leading apostrophe, quoted where needed (RFC 4180). */
export function csvCell(value: string | number | undefined, separator = ';'): string {
  if (value === undefined) {
    return '';
  }
  let text = String(value);
  if (FORMULA_START.test(text) && !PLAIN_NUMBER.test(text)) {
    text = `'${text}`;
  }
  return text.includes(separator) || /["\r\n]/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

/**
 * A CSV file for spreadsheets (ADR-0020 export): semicolons, as Excel expects them in
 * Switzerland, CRLF line ends and a byte order mark, so umlauts survive in Excel.
 */
export function toCsv(
  header: readonly string[],
  rows: readonly (readonly (string | number | undefined)[])[],
  separator = ';',
): string {
  const lines = [header, ...rows].map((row) =>
    row.map((cell) => csvCell(cell, separator)).join(separator),
  );
  return `${BYTE_ORDER_MARK}${lines.join('\r\n')}\r\n`;
}
