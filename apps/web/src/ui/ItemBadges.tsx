import type { ItemBadge } from '@fridgeai/core';
import { Droplets, PackageOpen, Snowflake, Store, type LucideIcon } from 'lucide-react';
import { messages } from '../app/messages.de-CH';

interface Look {
  icon: LucideIcon;
  classes: string;
  text: (badge: ItemBadge) => string;
}

/** «2026-11-03» → «3.11.» */
function shortDay(day: string): string {
  const [, month = '', date = ''] = day.split('-');
  return `${String(Number(date))}.${String(Number(month))}.`;
}

/**
 * Tones of the badges (docs/design.md): Eingefroren «Eis» filled, Aufgetaut ice on white with a
 * border, Geöffnet an outline in apricot (so it never looks like the filled «bald» chip), Von der
 * Theke «Oliv» filled.
 */
const looks: Record<ItemBadge['kind'], Look> = {
  frozen: {
    icon: Snowflake,
    classes: 'bg-ice-bg text-ice',
    text: (badge) => messages.badges.frozen('on' in badge ? shortDay(badge.on) : ''),
  },
  thawed: {
    icon: Droplets,
    classes: 'border border-ice bg-surface text-ice',
    text: () => messages.badges.thawed,
  },
  opened: {
    icon: PackageOpen,
    classes: 'border border-apricot bg-surface text-soon',
    text: () => messages.badges.opened,
  },
  loose: {
    icon: Store,
    classes: 'bg-olive-bg text-olive',
    text: () => messages.badges.loose,
  },
};

/**
 * Small text pills for the state of an item. Rows pass `max={2}` to stay calm, the item page shows
 * all. The icon is decoration; the text is the accessible name.
 */
export function ItemBadges({ badges, max }: { badges: readonly ItemBadge[]; max?: number }) {
  const shown = max === undefined ? badges : badges.slice(0, max);
  if (shown.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((badge) => {
        const { icon: Icon, classes, text } = looks[badge.kind];
        return (
          <li
            key={badge.kind}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs leading-4 font-semibold whitespace-nowrap ${classes}`}
          >
            <Icon size={12} aria-hidden="true" />
            {text(badge)}
          </li>
        );
      })}
    </ul>
  );
}
