import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { browserDeviceUnlock } from './browser-device-unlock';
import { DeviceUnlockError, type DeviceUnlock } from './device-unlock';
import {
  clearLockSettings,
  DEFAULT_LOCK_AFTER,
  LOCK_AFTER_MS,
  readLockSettings,
  writeLockSettings,
  type LockSettings,
} from './lock-settings';
import { AppLockContext, type AppLock, type LockOutcome } from './lock-context';
import { LockView } from './LockView';
import { useAppLock } from './lock-context';

async function attempt(action: () => Promise<void>): Promise<LockOutcome> {
  try {
    await action();
    return 'ok';
  } catch (error) {
    return error instanceof DeviceUnlockError ? error.kind : 'failed';
  }
}

interface AppLockProviderProps {
  children: ReactNode;
  unlock?: DeviceUnlock;
  store?: Parameters<typeof readLockSettings>[0];
  /** Clock for the time spent in the background (tests set it). */
  now?: () => number;
}

/**
 * Optional app lock (ADR-0086). Locked on start and when the app comes back after being hidden for
 * at least the chosen time. The state is held here, above the data and the router, so a locked app
 * renders none of its content.
 */
export function AppLockProvider({
  children,
  unlock = browserDeviceUnlock,
  store,
  now = Date.now,
}: AppLockProviderProps) {
  const [settings, setSettings] = useState<LockSettings | null>(() => readLockSettings(store));
  const [locked, setLocked] = useState(settings !== null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    let current = true;
    void unlock.isAvailable().then((value) => {
      if (current) {
        setAvailable(value);
      }
    });
    return () => {
      current = false;
    };
  }, [unlock]);

  const after = settings?.after;
  useEffect(() => {
    if (after === undefined) {
      return undefined;
    }
    const onChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = now();
        return;
      }
      const since = hiddenAt.current;
      hiddenAt.current = null;
      if (since !== null && now() - since >= LOCK_AFTER_MS[after]) {
        setLocked(true);
      }
    };
    document.addEventListener('visibilitychange', onChange);
    return () => {
      document.removeEventListener('visibilitychange', onChange);
    };
  }, [after, now]);

  const credentialId = settings?.credentialId;
  const remember = useCallback(
    (next: LockSettings) => {
      if (!writeLockSettings(next, store)) {
        throw new DeviceUnlockError('failed');
      }
      setSettings(next);
    },
    [store],
  );

  const value = useMemo<AppLock>(
    () => ({
      available,
      enabled: settings !== null,
      locked: locked && settings !== null,
      after: after ?? DEFAULT_LOCK_AFTER,
      enable: () =>
        attempt(async () => {
          const id = await unlock.register();
          remember({ credentialId: id, after: DEFAULT_LOCK_AFTER });
          setLocked(false);
        }),
      disable: () =>
        attempt(async () => {
          if (credentialId !== undefined) {
            await unlock.verify(credentialId);
          }
          clearLockSettings(store);
          setSettings(null);
          setLocked(false);
        }),
      unlock: () =>
        attempt(async () => {
          if (credentialId !== undefined) {
            await unlock.verify(credentialId);
          }
          setLocked(false);
        }),
      resetup: () =>
        attempt(async () => {
          const id = await unlock.register();
          remember({ credentialId: id, after: after ?? DEFAULT_LOCK_AFTER });
          setLocked(false);
        }),
      setAfter: (next) => {
        if (credentialId !== undefined) {
          remember({ credentialId, after: next });
        }
      },
    }),
    [available, settings, locked, after, credentialId, unlock, remember, store],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

/** Shows the lock view instead of the app while locked: the content is not in the page at all. */
export function AppLockGate({ children }: { children: ReactNode }) {
  const { locked } = useAppLock();
  return locked ? <LockView /> : children;
}
