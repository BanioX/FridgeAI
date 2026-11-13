/**
 * The app lock's settings live in localStorage of this device, on purpose not in the database:
 * they must never travel with an export or import, or a restore on another phone would lock the
 * person out of data the credential there knows nothing about (ADR-0086).
 */

export type LockAfter = 'now' | '1m' | '5m';

export const LOCK_AFTER_MS: Record<LockAfter, number> = {
  now: 0,
  '1m': 60_000,
  '5m': 300_000,
};

export const DEFAULT_LOCK_AFTER: LockAfter = '1m';

export interface LockSettings {
  /** The credential id, base64url. */
  credentialId: string;
  after: LockAfter;
}

const KEY = 'fridgeai:app-lock';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function localStore(): Store | undefined {
  try {
    return window.localStorage;
  } catch {
    // Blocked storage (private mode): the lock cannot be remembered, so it stays off.
    return undefined;
  }
}

const isLockAfter = (value: unknown): value is LockAfter =>
  value === 'now' || value === '1m' || value === '5m';

export function readLockSettings(store: Store | undefined = localStore()): LockSettings | null {
  try {
    const raw = store?.getItem(KEY) ?? null;
    if (raw === null) {
      return null;
    }
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return null;
    }
    const { credentialId, after } = value as Record<string, unknown>;
    if (typeof credentialId !== 'string' || credentialId === '') {
      return null;
    }
    return { credentialId, after: isLockAfter(after) ? after : DEFAULT_LOCK_AFTER };
  } catch {
    return null;
  }
}

/** Returns whether the settings were stored; a lock that cannot be kept must not be switched on. */
export function writeLockSettings(
  settings: LockSettings,
  store: Store | undefined = localStore(),
): boolean {
  try {
    if (store === undefined) {
      return false;
    }
    store.setItem(KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function clearLockSettings(store: Store | undefined = localStore()): void {
  try {
    store?.removeItem(KEY);
  } catch {
    // Blocked storage: nothing was written, nothing to clear.
  }
}
