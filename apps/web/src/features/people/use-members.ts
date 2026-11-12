import type { MemberView } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppData } from '../../app/AppData';

/** The active people of the household, live (oldest first); undefined while loading. */
export function useMembers(): readonly MemberView[] | undefined {
  const { householdId, household } = useAppData();
  return useLiveQuery(
    async () => (await household['household.members']({ householdId })).members,
    [householdId, household],
  );
}
