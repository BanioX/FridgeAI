import type { InventoryItemView } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppData } from '../../app/AppData';

/** One active item, live: undefined while loading, null if it is gone (closed or unknown). */
export function useInventoryItem(itemId: string | undefined): InventoryItemView | null | undefined {
  const { householdId, inventory } = useAppData();
  return useLiveQuery(
    async () =>
      (await inventory['inventory.list']({ householdId })).items.find(
        (view) => view.id === itemId,
      ) ?? null,
    [householdId, itemId],
  );
}
