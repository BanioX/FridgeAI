import { localDate, type LocalDate } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppData } from '../../app/AppData';

/** Before any Rettich entry: «Seit Beginn» asks from here. */
export const SINCE_START: LocalDate = localDate('2020-01-01');

/** The footprint of rescued and entsorgt food in a period (`stats.footprint`, ADR-0057). */
export function useFootprint(from: LocalDate, to: LocalDate) {
  const { householdId, inventory } = useAppData();
  return useLiveQuery(
    () => inventory['stats.footprint']({ householdId, from, to }),
    [householdId, from, to],
  );
}
