import { CircleCheck, CookingPot, ShoppingBasket, Trash2, type LucideIcon } from 'lucide-react';
import { messages } from '../../app/messages.de-CH';
import {
  dropKey,
  sameTarget,
  SETTLE_ACTIONS,
  type DropTarget,
  type SettleAction,
} from './drop-target';

const pots: Record<SettleAction, { icon: LucideIcon; classes: string }> = {
  eaten: { icon: CircleCheck, classes: 'bg-basil-50 text-basil-700' },
  wasted: { icon: Trash2, classes: 'bg-today-bg text-today' },
  process: { icon: CookingPot, classes: 'bg-surface-muted text-ink' },
  rebuy: { icon: ShoppingBasket, classes: 'bg-surface-muted text-ink' },
};

/**
 * The pots (ADR-0055) under the location tabs in select mode: tap one to settle the selection, or
 * drop a dragged parcel on it. Real buttons, so the drag stays a shortcut (WCAG 2.5.7). While a
 * parcel is dragged they get the dashed «drop here» look of the tabs; the one under the finger
 * lifts and gets a solid outline.
 */
export function SettlePots({
  disabled,
  dragging,
  over,
  onPick,
}: {
  /** Nothing is chosen, or something is being saved. */
  disabled: boolean;
  dragging: boolean;
  over: DropTarget | null;
  onPick: (action: SettleAction) => void;
}) {
  const t = messages.inventory.settle;
  return (
    <section aria-label={t.label} className="grid grid-cols-4 gap-2">
      {SETTLE_ACTIONS.map((action) => {
        const { icon: Icon, classes } = pots[action];
        const target: DropTarget = { kind: 'action', action };
        const lifted = sameTarget(over, target);
        return (
          <button
            key={action}
            type="button"
            disabled={disabled}
            onClick={() => {
              onPick(action);
            }}
            data-drop-target={dropKey(target)}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-center text-xs leading-tight font-semibold transition-[opacity,transform] ${classes} ${
              disabled && !dragging ? 'opacity-50' : ''
            } ${
              lifted
                ? 'relative z-10 outline-2 outline-basil-600 motion-safe:scale-105'
                : dragging
                  ? 'outline-2 -outline-offset-2 outline-dashed outline-basil-600'
                  : ''
            }`}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{t[action]}</span>
          </button>
        );
      })}
    </section>
  );
}
