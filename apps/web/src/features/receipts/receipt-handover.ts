/**
 * A receipt photo taken elsewhere (Start, «Foto aufnehmen») travels to «Quittung hochladen»: the
 * camera opens on the tap there, and the receipt page reads the photo when it opens. When the
 * text was already read, it comes along so the photo is not read twice. In memory for that one
 * step only; nothing is stored.
 */
export interface HandedOverPhoto {
  file: File;
  text?: string;
}

let handedOver: readonly HandedOverPhoto[] = [];

export function handOverReceiptPhotos(photos: readonly HandedOverPhoto[]): void {
  handedOver = photos;
}

/** The photos handed over, once: a second call returns none. */
export function takeReceiptPhotos(): readonly HandedOverPhoto[] {
  const photos = handedOver;
  handedOver = [];
  return photos;
}
