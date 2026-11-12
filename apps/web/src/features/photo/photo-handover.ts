/** The photo taken on Start or under «Erfassen», on its way to «Foto aufnehmen» (ADR-0068). */
let handedOver: File | null = null;

export function handOverPhoto(file: File): void {
  handedOver = file;
}

/** The photo, once: a second call returns none. */
export function takePhoto(): File | null {
  const file = handedOver;
  handedOver = null;
  return file;
}
