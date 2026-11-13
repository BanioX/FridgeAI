import {
  categoryById,
  fallbackCategory,
  isFreezable,
  startOfMonth,
  type Rappen,
  type StorageLocation,
} from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Trash2, Undo2, type LucideIcon } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { messages } from '../../app/messages.de-CH';
import { categoryIcon } from '../../ui/food-icon-nodes';

const t = messages.ritual;

/** How long the moment stays: a rescue is a quick joy, a loss needs a second to read the tip. */
const RESCUED_MS = 3200;
const WASTED_MS = 5200;

/** Eight leaves fly out of the tile when something is rescued: angle in degrees. */
const LEAVES = [0, 45, 90, 135, 180, 225, 270, 315];

/** The food's picture, large; the icon comes in as a prop (no component made while rendering). */
function Glyph({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon size={44} strokeWidth={1.75} />;
}

export interface Moment {
  key: number;
  kind: 'rescued' | 'wasted';
  name: string;
  categoryId: string;
  location: StorageLocation;
  valueRappen: Rappen;
}

/** One line that helps next time: freeze it earlier, a tip of the category, or a kind nudge. */
export function nextTimeTip(moment: {
  categoryId: string;
  location: StorageLocation;
  valueRappen: number;
}) {
  const category = categoryById(moment.categoryId) ?? fallbackCategory();
  if (isFreezable(category) && moment.location !== 'freezer') {
    return t.freezeNext;
  }
  return category.tips.de[0] ?? t.nudges[moment.valueRappen % t.nudges.length] ?? t.nudges[0];
}

/**
 * The ritual on Start (ADR-0084): a rescue gets a short celebration (the food's picture pops,
 * leaves fly out, the month's count and amount), a loss a short, honest moment (the picture drops
 * into the bin) with a tip for next time. A tap, «Rückgängig» or a few seconds end it. Without
 * motion (`prefers-reduced-motion`) the same card simply appears.
 */
export function RescueMoment({
  moment,
  onUndo,
  onClose,
}: {
  moment: Moment;
  onUndo: () => void;
  onClose: () => void;
}) {
  const { householdId, inventory, today } = useAppData();
  const money = useMoney();
  const month = useLiveQuery(
    () => inventory['stats.waste']({ householdId, from: startOfMonth(today), to: today }),
    [householdId, today],
  );
  const rescued = moment.kind === 'rescued';

  useEffect(() => {
    const timer = window.setTimeout(onClose, rescued ? RESCUED_MS : WASTED_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [moment.key, onClose, rescued]);

  const value = money.format(moment.valueRappen);
  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-onyx/30 p-6"
      onClick={onClose}
    >
      <div
        role="status"
        className="moment-in w-full max-w-xs space-y-3 rounded-3xl bg-surface p-6 text-center shadow-float"
      >
        <div className="relative mx-auto size-24">
          {rescued
            ? LEAVES.map((angle) => (
                <span
                  key={angle}
                  aria-hidden="true"
                  className="leaf-burst absolute top-1/2 left-1/2 size-3 rounded-full bg-basil-400"
                  style={{ ['--angle' as string]: `${String(angle)}deg` }}
                />
              ))
            : null}
          <span
            aria-hidden="true"
            className={`absolute inset-0 grid place-items-center rounded-3xl ${
              rescued
                ? 'rescue-pop bg-basil-700 text-white'
                : 'waste-drop bg-surface-muted text-ink'
            }`}
          >
            <Glyph icon={categoryIcon(moment.categoryId)} />
          </span>
          <span
            aria-hidden="true"
            className={`absolute -right-2 -bottom-2 grid size-9 place-items-center rounded-full border-4 border-surface ${
              rescued ? 'bg-basil-700 text-white' : 'bg-danger text-white'
            }`}
          >
            {rescued ? <Check size={18} /> : <Trash2 size={16} />}
          </span>
        </div>
        <p className="font-display text-2xl font-semibold">{rescued ? t.rescued : t.wasted}</p>
        <p className="text-ink-muted">
          {rescued ? t.rescuedLine(moment.name, value) : t.wastedLine(moment.name, value)}
        </p>
        {rescued ? (
          month === undefined || month.savedCount === 0 ? null : (
            <p className="font-semibold text-basil-800">
              {t.monthLine(month.savedCount, money.format(month.savedRappen))}
            </p>
          )
        ) : (
          <p className="text-sm">{nextTimeTip(moment)}</p>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onUndo();
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-basil-700 hover:bg-surface-muted"
        >
          <Undo2 size={20} aria-hidden="true" />
          {messages.inventory.undo}
        </button>
      </div>
    </div>,
    document.body,
  );
}
