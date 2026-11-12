import type { StorageLocation } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';
import { locationStyle } from '../../ui/LocationTile';
import { locationOrder } from './item-meta';

/**
 * Floating bar above the tab bar while items are selected: how many, and one button per other
 * storage location to move them to.
 */
export function SelectionBar({
  count,
  from,
  busy,
  onMove,
  onEdit,
}: {
  count: number;
  from: StorageLocation;
  busy: boolean;
  onMove: (to: StorageLocation) => void;
  onEdit: () => void;
}) {
  const t = messages.inventory.select;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-xl px-4">
      <section
        aria-label={t.barLabel}
        className="pointer-events-auto space-y-2 rounded-2xl bg-surface p-3 shadow-float"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{t.count(count)}</p>
          <button
            type="button"
            disabled={busy}
            onClick={onEdit}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line px-4 text-sm font-semibold text-basil-700 transition-colors hover:bg-basil-50 disabled:opacity-50"
          >
            {t.edit}
          </button>
        </div>
        <p className="text-sm text-ink-muted">{t.moveTo}</p>
        <div className="grid grid-cols-3 gap-2">
          {locationOrder
            .filter((location) => location !== from)
            .map((location) => {
              const { icon: Icon, classes } = locationStyle[location];
              return (
                <button
                  key={location}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    onMove(location);
                  }}
                  className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[0.8125rem] leading-tight font-semibold transition-opacity disabled:opacity-50 ${classes}`}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{messages.locations[location]}</span>
                </button>
              );
            })}
        </div>
      </section>
    </div>
  );
}
