/**
 * After an update the open app may still run the old code and ask for page chunks that no longer
 * exist on the server (Cloudflare then answers with index.html, the service worker has already
 * dropped the old cache). One reload fetches the new version. A time guard prevents a reload loop
 * if the chunk is missing for another reason.
 */

/** How browsers report a module that could not be loaded (Chrome, Firefox, Safari). */
const STALE_BUILD =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|is not a valid JavaScript MIME type|Unable to preload CSS/i;

export function isStaleBuildError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
  return message !== undefined && STALE_BUILD.test(message);
}

const KEY = 'fridgeai:reloaded-for-update';
/** A second failure within this time is a real error, not an update: show it instead. */
const GUARD_MS = 30_000;

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function sessionStore(): Store | undefined {
  try {
    return window.sessionStorage;
  } catch {
    // Storage can be blocked (private mode, settings): then no automatic reload.
    return undefined;
  }
}

/** True if no automatic reload happened in the last 30 seconds. */
export function mayReloadForUpdate(store = sessionStore(), now = Date.now()): boolean {
  try {
    const last = Number(store?.getItem(KEY) ?? 0);
    return store !== undefined && now - last > GUARD_MS;
  } catch {
    return false;
  }
}

/** Reloads once for a new version; returns false if the guard stops it. */
export function reloadForUpdate(
  store = sessionStore(),
  now = Date.now(),
  reload: () => void = () => {
    window.location.reload();
  },
): boolean {
  if (!mayReloadForUpdate(store, now)) {
    return false;
  }
  try {
    store?.setItem(KEY, String(now));
  } catch {
    return false;
  }
  reload();
  return true;
}
