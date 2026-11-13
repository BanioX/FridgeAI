import { createContext, useContext } from 'react';
import type { DeviceUnlockFailure } from './device-unlock';
import { DEFAULT_LOCK_AFTER, type LockAfter } from './lock-settings';

export type LockOutcome = 'ok' | DeviceUnlockFailure;

export interface AppLock {
  /** `null` while the device is still being asked. */
  available: boolean | null;
  enabled: boolean;
  locked: boolean;
  after: LockAfter;
  /** Creates the credential (the owner unlocks the device) and switches the lock on. */
  enable: () => Promise<LockOutcome>;
  /** Switching off needs a successful unlock first. */
  disable: () => Promise<LockOutcome>;
  unlock: () => Promise<LockOutcome>;
  /** No lockout: a new credential proves the device owner, replaces the old one and unlocks. */
  resetup: () => Promise<LockOutcome>;
  setAfter: (after: LockAfter) => void;
}

/** Without a provider (tests of single pages) the lock is simply not there. */
const OFF: AppLock = {
  available: false,
  enabled: false,
  locked: false,
  after: DEFAULT_LOCK_AFTER,
  enable: () => Promise.resolve('failed'),
  disable: () => Promise.resolve('ok'),
  unlock: () => Promise.resolve('ok'),
  resetup: () => Promise.resolve('failed'),
  setAfter: () => undefined,
};

export const AppLockContext = createContext<AppLock>(OFF);

export const useAppLock = () => useContext(AppLockContext);
