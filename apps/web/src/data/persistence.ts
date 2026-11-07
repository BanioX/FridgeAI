/**
 * Asks the browser to keep rettich's data even when space runs low (ADR-0020: the data lives
 * only on the device). Chrome and Firefox decide by usage or ask; Safari keeps data of installed
 * home-screen apps anyway, but may clear websites unused for 7 days, so installing is the safe
 * way on the iPhone (hint on «Haushalt»). Never throws: without it the app still works.
 */
export async function requestPersistentStorage(
  storage: Pick<StorageManager, 'persisted' | 'persist'> | undefined,
): Promise<boolean> {
  if (storage === undefined) {
    return false;
  }
  try {
    return (await storage.persisted()) || (await storage.persist());
  } catch {
    return false;
  }
}
