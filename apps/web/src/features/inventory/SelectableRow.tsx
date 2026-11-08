import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * A row in select mode: a real checkbox (visually hidden, named after the item) inside a label, so
 * a tap anywhere on the row toggles it. `relative` keeps the hidden input inside the row (L-23).
 */
export function SelectableRow({
  name,
  selected,
  onToggle,
  children,
}: {
  name: string;
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <label className="relative flex cursor-pointer items-center pl-4 active:bg-surface-muted">
      <input
        type="checkbox"
        aria-label={name}
        checked={selected}
        onChange={onToggle}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`grid size-6 shrink-0 place-items-center rounded-full border-2 text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${
          selected ? 'border-basil-700 bg-basil-700' : 'border-silver bg-surface'
        }`}
      >
        {selected ? <Check size={16} strokeWidth={3} /> : null}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  );
}
