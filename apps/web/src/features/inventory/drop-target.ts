import { StorageLocationSchema, type StorageLocation } from '@fridgeai/core';

/** The tabs carry `data-drop-location="fridge"` etc.; this finds the one under an element. */
export function dropLocationFrom(element: Element | null): StorageLocation | null {
  const parsed = StorageLocationSchema.safeParse(
    element?.closest('[data-drop-location]')?.getAttribute('data-drop-location'),
  );
  return parsed.success ? parsed.data : null;
}
