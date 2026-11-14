/** The longest text the list field takes (the textarea's `maxLength`). */
export const MAX_INCOMING = 500;

/** Query names that carry text into the shopping list (ADR-0094). */
export const INCOMING_PARAMS = ['add', 'text', 'title', 'url'] as const;

/**
 * Text that arrives from outside: an own link `/shopping?add=Milch, Brot` or the Android share
 * sheet (`text`, `title`). A shared link (`url`) is not a thing to buy and is left out. Lines are
 * trimmed, empty lines dropped, the result cut to the length the field accepts.
 */
export function incomingShoppingText(params: URLSearchParams): string | undefined {
  for (const key of ['add', 'text', 'title'] as const) {
    const lines = (params.get(key) ?? '')
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line !== '');
    if (lines.length > 0) {
      return lines.join('\n').slice(0, MAX_INCOMING);
    }
  }
  return undefined;
}

/** Whether the address still carries incoming text that should be removed after reading it. */
export function hasIncoming(params: URLSearchParams): boolean {
  return INCOMING_PARAMS.some((key) => params.has(key));
}
