function wordsOf(name: string): string[] {
  return name
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '');
}

function upper(text: string): string {
  return text.toLocaleUpperCase('de-CH');
}

/** First letters of the first two words, uppercase. */
function baseInitials(name: string): string {
  return upper(
    wordsOf(name)
      .slice(0, 2)
      .map((word) => Array.from(word)[0] ?? '')
      .join(''),
  );
}

/**
 * The letters of the «Gehört» badge (ADR-0058): the first letters of the first two words,
 * uppercase («Mia Muster» gives «MM», «Noah» gives «N»). When another active member would get
 * the same letters, the first two letters of the first name are used instead («Mi» and «Ma»).
 * `others` are the display names of the other active members.
 */
export function initialsOf(displayName: string, others: readonly string[] = []): string {
  const base = baseInitials(displayName);
  if (!others.some((other) => baseInitials(other) === base)) {
    return base;
  }
  const letters = Array.from(wordsOf(displayName)[0] ?? '').slice(0, 2);
  if (letters.length < 2) {
    return base;
  }
  return upper(letters[0] ?? '') + (letters[1] ?? '').toLocaleLowerCase('de-CH');
}
