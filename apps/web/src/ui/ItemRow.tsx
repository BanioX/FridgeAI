import { StatusChip } from './StatusChip';
import { toneClasses, type Tone } from './tones';

interface ItemRowProps {
  emoji: string;
  /** Pack picture (data URL); replaces the emoji when there is one. */
  image?: string | undefined;
  name: string;
  meta: string;
  status: { tone: Tone; label: string };
}

/** One inventory item: status bar, pack picture or food emoji, name, meta line and expiry chip. */
export function ItemRow({ emoji, image, name, meta, status }: ItemRowProps) {
  return (
    <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface py-3 pr-3 pl-4 shadow-card">
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${toneClasses[status.tone].accent}`}
      />
      {image === undefined ? (
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center text-2xl leading-none"
        >
          {emoji}
        </span>
      ) : (
        <img
          src={image}
          alt=""
          className="size-10 shrink-0 rounded-lg bg-surface-muted object-contain"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name}</p>
        <p className="truncate text-sm text-ink-muted">{meta}</p>
      </div>
      <StatusChip tone={status.tone}>{status.label}</StatusChip>
    </div>
  );
}
