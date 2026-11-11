import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { urgentItems } from '../features/today/urgent-items';
import { useAppData } from './AppData';

/** The Badging API; not in every TypeScript DOM lib and missing in many browsers. */
interface BadgeNavigator {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
}

/**
 * Shows `count` on the app icon of an installed PWA (K2): the number of items in «Heute retten»,
 * nothing at 0. Feature-detected, asks for no permission and swallows every failure, e.g. iOS
 * without notification permission, where it simply does nothing.
 */
export async function syncAppBadge(
  count: number,
  nav: BadgeNavigator | undefined = typeof navigator === 'undefined' ? undefined : navigator,
): Promise<void> {
  try {
    if (count > 0) {
      await nav?.setAppBadge?.(count);
    } else {
      await nav?.clearAppBadge?.();
    }
  } catch {
    // The badge is a nicety: never let it break the app.
  }
}

/** Keeps the app icon badge in step with «Heute retten»: on start and on every inventory change. */
export function useAppBadge(): void {
  const { householdId, inventory } = useAppData();
  const count = useLiveQuery(
    async () =>
      urgentItems(
        (await inventory['inventory.listExpiring']({ householdId, withinDays: 30 })).items,
      ).length,
    [householdId],
  );
  useEffect(() => {
    if (count !== undefined) {
      void syncAppBadge(count);
    }
  }, [count]);
}
