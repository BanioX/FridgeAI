import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { viewOf, type AchievementView } from './achievement-view';

/** The achievements of the household, computed from the data on the device; undefined while loading. */
export function useAchievements(): AchievementView[] | undefined {
  const { householdId, inventory } = useAppData();
  const money = useMoney();
  const result = useLiveQuery(
    () => inventory['stats.achievements']({ householdId }),
    [householdId],
  );
  return useMemo(() => result?.achievements.map((state) => viewOf(state, money)), [result, money]);
}

/** Unlocked ones, the most recently reached first (ties keep the catalogue order). */
export function newestFirst(views: readonly AchievementView[]): AchievementView[] {
  return views
    .filter((view) => view.state.tier > 0 && view.state.reachedOn !== null)
    .sort((a, b) => (b.state.reachedOn ?? '').localeCompare(a.state.reachedOn ?? ''));
}
