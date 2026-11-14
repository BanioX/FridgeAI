import { ShoppingBasket, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { messages } from '../../app/messages.de-CH';
import { dropKey, sameTarget, type DropTarget } from '../inventory/drop-target';

const t = messages.ritual;
const BASKET: DropTarget = { kind: 'action', action: 'eaten' };
const BIN: DropTarget = { kind: 'action', action: 'wasted' };

/**
 * While a row of «Heute retten» is held (ADR-0084): the basket «Gerettet» and the bin «Entsorgt»
 * rise above the tab bar; the one under the finger grows. Dropping there records it, with the
 * moment. A shortcut for the swipe and the item page, which stay the accessible ways.
 */
export function RitualTargets({ over }: { over: DropTarget | null }) {
  const basket = sameTarget(over, BASKET);
  const bin = sameTarget(over, BIN);
  return createPortal(
    <div
      aria-hidden="true"
      className="moment-in fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] lg:left-64 z-40 mx-auto grid max-w-xl grid-cols-2 gap-3 px-4"
    >
      <div
        data-drop-target={dropKey(BASKET)}
        className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed font-semibold transition-transform ${
          basket
            ? 'scale-105 border-basil-700 bg-basil-700 text-white'
            : 'border-basil-600 bg-basil-50 text-basil-800'
        }`}
      >
        <ShoppingBasket size={32} />
        {t.basket}
      </div>
      <div
        data-drop-target={dropKey(BIN)}
        className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed font-semibold transition-transform ${
          bin
            ? 'scale-105 border-danger bg-danger text-white'
            : 'border-danger bg-today-bg text-today'
        }`}
      >
        <Trash2 size={30} />
        {t.bin}
      </div>
    </div>,
    document.body,
  );
}
