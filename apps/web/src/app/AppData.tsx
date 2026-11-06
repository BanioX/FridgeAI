import type { Id, IdGenerator, LocalDate } from '@fridgeai/core';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { browserClock, browserIds } from '../data/adapters';
import { ensureLocalHousehold } from '../data/bootstrap';
import { FridgeDb } from '../data/db';
import { createInventoryHandlers, type InventoryHandlers } from '../data/handlers';
import { createHouseholdHandlers, type HouseholdHandlers } from '../data/household-handlers';
import { createShoppingHandlers, type ShoppingHandlers } from '../data/shopping-handlers';
import { cachedCatalog } from '../data/catalog-cache';
import { openFoodFactsCatalog } from '../data/open-food-facts';
import { fetchProductImage } from '../data/product-images';
import { messages } from './messages.de-CH';

export interface AppData {
  db: FridgeDb;
  householdId: Id;
  memberId: Id;
  ids: IdGenerator;
  /** Swiss calendar day when the app was opened; refreshed when the app becomes visible again. */
  today: LocalDate;
  inventory: InventoryHandlers;
  shopping: ShoppingHandlers;
  household: HouseholdHandlers;
}

const AppDataContext = createContext<AppData | null>(null);

let defaultDb: FridgeDb | undefined;

/**
 * Opens the local database, makes sure a local household exists (US-15) and provides the contract
 * handlers to the UI. Pages never touch Dexie directly (ADR-0005).
 */
export function AppDataProvider({ children, db }: { children: ReactNode; db?: FridgeDb }) {
  const [data, setData] = useState<AppData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const database = db ?? (defaultDb ??= new FridgeDb());
    let cancelled = false;
    ensureLocalHousehold(database, browserClock, browserIds, {
      household: messages.defaults.householdName,
      member: messages.defaults.memberName,
    })
      .then((profile) => {
        if (cancelled) {
          return;
        }
        const context = {
          db: database,
          clock: browserClock,
          ids: browserIds,
          actor: profile.member.id,
          catalog: cachedCatalog(database, openFoodFactsCatalog(), browserClock, {
            image: (url) => fetchProductImage(url),
          }),
        };
        setData({
          db: database,
          householdId: profile.household.id,
          memberId: profile.member.id,
          ids: browserIds,
          today: browserClock.today(),
          inventory: createInventoryHandlers(context),
          shopping: createShoppingHandlers(context),
          household: createHouseholdHandlers(context),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [db]);

  // A new day starts while the app is open in the background: refresh «today».
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        setData((current) => {
          const today = browserClock.today();
          return current === null || current.today === today ? current : { ...current, today };
        });
      }
    };
    document.addEventListener('visibilitychange', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  if (failed) {
    return <p className="p-6 text-today">{messages.errors.storage}</p>;
  }
  if (data === null) {
    return <p className="sr-only">{messages.loading}</p>;
  }
  return <AppDataContext.Provider value={data}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const data = useContext(AppDataContext);
  if (data === null) {
    throw new Error('useAppData must be used inside <AppDataProvider>');
  }
  return data;
}
