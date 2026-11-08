import type { Id } from '@fridgeai/core';
import { useCallback, useMemo, useState } from 'react';

interface Stored {
  scope: string;
  ids: ReadonlySet<Id>;
}

export interface Selection {
  /** Select mode is on (iOS «Auswählen»). */
  active: boolean;
  ids: ReadonlySet<Id>;
  start: () => void;
  /** Leaves select mode and forgets the selection. */
  stop: () => void;
  toggle: (id: Id) => void;
  selectAll: (ids: readonly Id[]) => void;
  clear: () => void;
}

/**
 * Multi-select state for lists (iOS «Auswählen»). `scope` names what is listed, e.g. the storage
 * location: when it changes, the selection is dropped but select mode stays on. Kept free of UI so
 * drag and drop can reuse it later.
 */
export function useSelection(scope: string): Selection {
  const [active, setActive] = useState(false);
  const [stored, setStored] = useState<Stored>({ scope, ids: new Set() });
  const ids = useMemo<ReadonlySet<Id>>(
    () => (stored.scope === scope ? stored.ids : new Set()),
    [stored, scope],
  );

  const set = useCallback(
    (next: (current: ReadonlySet<Id>) => ReadonlySet<Id>) => {
      setStored((old) => ({ scope, ids: next(old.scope === scope ? old.ids : new Set()) }));
    },
    [scope],
  );

  return {
    active,
    ids,
    start: useCallback(() => {
      setActive(true);
    }, []),
    stop: useCallback(() => {
      setActive(false);
      set(() => new Set());
    }, [set]),
    toggle: useCallback(
      (id: Id) => {
        set((current) => {
          const next = new Set(current);
          if (!next.delete(id)) {
            next.add(id);
          }
          return next;
        });
      },
      [set],
    ),
    selectAll: useCallback(
      (all: readonly Id[]) => {
        set(() => new Set(all));
      },
      [set],
    ),
    clear: useCallback(() => {
      set(() => new Set());
    }, [set]),
  };
}
