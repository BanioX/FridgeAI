import { useState } from 'react';

/** How the Vorrat lists its items: soonest first, or in blocks by kind (ADR-0067). */
export type InventoryView = 'expiry' | 'kind';

const KEY = 'fridgeai:inventory-view';

function read(): InventoryView {
  try {
    return window.localStorage.getItem(KEY) === 'kind' ? 'kind' : 'expiry';
  } catch {
    return 'expiry';
  }
}

function write(view: InventoryView): void {
  try {
    window.localStorage.setItem(KEY, view);
  } catch {
    // Private mode or blocked storage: the choice holds until the page closes.
  }
}

/** The chosen view, remembered on this device: a display choice, not household data. */
export function useInventoryView(): [InventoryView, (view: InventoryView) => void] {
  const [view, setView] = useState(read);
  return [
    view,
    (next) => {
      write(next);
      setView(next);
    },
  ];
}
