import type { Gtin } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppData } from '../../app/AppData';

/** The pack picture for a barcode as data URL, once the device has it (it may arrive later). */
export function useProductImage(gtin: Gtin | undefined): string | undefined {
  const { householdId, inventory } = useAppData();
  return useLiveQuery(
    async () =>
      gtin === undefined
        ? undefined
        : (await inventory['products.image']({ householdId, gtin })).image?.dataUrl,
    [householdId, gtin],
  );
}
