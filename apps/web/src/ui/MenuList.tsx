import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from './GroupedList';

export interface MenuEntry {
  to: string;
  icon: LucideIcon;
  title: string;
  detail?: string;
}

/**
 * A menu as in the iOS settings (ADR-0021, ADR-0031): each row is a picture in a tinted square, a
 * title, one line saying what is behind it, and a chevron. The whole row is the link.
 */
export function MenuList({ entries }: { entries: readonly MenuEntry[] }) {
  return (
    <GroupedList>
      {entries.map(({ to, icon: Icon, title, detail }) => (
        <GroupedListItem key={to}>
          <Link
            to={to}
            className={`${GROUPED_ROW_LINK} flex min-h-14 items-center gap-3 py-2 pr-3 pl-4`}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-basil-700">
              <Icon size={22} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{title}</span>
              {detail === undefined ? null : (
                <span className="block text-sm text-ink-muted">{detail}</span>
              )}
            </span>
            <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ink-muted/60" />
          </Link>
        </GroupedListItem>
      ))}
    </GroupedList>
  );
}
