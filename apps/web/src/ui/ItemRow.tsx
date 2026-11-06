import { StatusChip } from './StatusChip';
import { toneClasses, type Tone } from './tones';

interface ItemRowProps {
  emoji: string;
  name: string;
  meta: string;
  status: { tone: Tone; label: string };
}

/** One inventory item: status bar, food emoji, name, meta line and expiry chip. */
export function ItemRow({ emoji, name, meta, status }: ItemRowProps) {
  return (
    <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface py-3 pr-3 pl-4 shadow-card">
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${toneClasses[status.tone].accent}`}
      />
      <span aria-hidden="true" className="text-2xl leading-none">
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name}</p>
        <p className="truncate text-sm text-ink-muted">{meta}</p>
      </div>
      <StatusChip tone={status.tone}>{status.label}</StatusChip>
    </div>
  );
}
