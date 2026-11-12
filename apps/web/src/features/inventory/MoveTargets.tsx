import type { StorageLocation } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';
import { locationStyle } from '../../ui/LocationTile';
import { dropKey, sameTarget, type DropTarget } from './drop-target';
import { locationOrder } from './item-meta';

/**
 * «Verschieben nach» while items are chosen: it takes the place of the location tabs, in the same
 * box, so a tap and a drop hit the same four targets and nothing is offered twice (Alban,
 * 12.11.2026: «macht keinen Sinn, oben als auch unten dieselbe Funktion zu haben»). The location
 * the items lie in now is shown as «hier» and is no target. Real buttons: the drag stays a
 * shortcut (WCAG 2.5.7).
 */
export function MoveTargets({
  from,
  busy,
  dragging,
  over,
  onMove,
}: {
  from: StorageLocation;
  busy: boolean;
  dragging: boolean;
  over: DropTarget | null;
  onMove: (to: StorageLocation) => void;
}) {
  const t = messages.inventory.select;
  return (
    <div
      role="group"
      aria-label={t.moveTo}
      className="grid grid-cols-4 gap-0.5 rounded-xl bg-surface-muted p-0.5"
    >
      {locationOrder.map((location) => {
        const { icon: Icon, classes } = locationStyle[location];
        const here = location === from;
        const target: DropTarget = { kind: 'location', location };
        const lifted = sameTarget(over, target);
        return (
          <button
            key={location}
            type="button"
            disabled={here || busy}
            onClick={() => {
              onMove(location);
            }}
            {...(here ? {} : { 'data-drop-target': dropKey(target) })}
            className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[0.625rem] px-1 text-center text-[0.8125rem] leading-tight font-semibold hyphens-calm transition-[opacity,transform] ${
              here ? 'text-ink-muted' : classes
            } ${busy && !here ? 'opacity-50' : ''} ${
              lifted
                ? 'relative z-10 outline-2 outline-basil-600 motion-safe:scale-105'
                : dragging && !here
                  ? 'outline-2 -outline-offset-2 outline-dashed outline-basil-600'
                  : ''
            }`}
          >
            {here ? null : <Icon size={16} aria-hidden="true" />}
            <span>{messages.locations[location]}</span>
            {here ? <span className="text-xs font-normal">{t.here}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
