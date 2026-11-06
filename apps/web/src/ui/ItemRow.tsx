import { ChevronRight } from 'lucide-react';
import { StatusChip } from './StatusChip';
import type { Tone } from './tones';

interface ItemRowProps {
  emoji: string;
  /** Pack picture (data URL); replaces the emoji when there is one. */
  image?: string | undefined;
  name: string;
  meta: string;
  status: { tone: Tone; label: string };
  /** Disclosure chevron for rows that open a detail page (Apple: «›» on navigating rows). */
  chevron?: boolean;
}

/**
 * One inventory item as a row of a grouped list: pack picture or food emoji, name, meta line and
 * the expiry chip, whose text carries the status (colour only supports it).
 */
export function ItemRow({ emoji, image, name, meta, status, chevron = false }: ItemRowProps) {
  return (
    <div className="flex min-h-15 items-center gap-3 py-2.5 pr-3 pl-4">
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
      {chevron ? (
        <ChevronRight size={18} aria-hidden="true" className="-ml-1 shrink-0 text-ink-muted/60" />
      ) : null}
    </div>
  );
}
