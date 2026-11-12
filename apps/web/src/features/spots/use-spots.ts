import { useLiveQuery } from 'dexie-react-hooks';
import { useAppData } from '../../app/AppData';

/** The household's storage spots, live: undefined while loading (ADR-0056). */
export function useSpots() {
  const { householdId, inventory } = useAppData();
  return useLiveQuery(
    async () => (await inventory['spots.list']({ householdId })).spots,
    [householdId],
  );
}
