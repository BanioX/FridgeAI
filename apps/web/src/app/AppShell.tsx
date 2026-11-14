import { BookOpen, CircleEllipsis, House, Plus, Refrigerator, type LucideIcon } from 'lucide-react';
import { useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { AchievementToast } from '../features/achievements/AchievementToast';
import { useAppBadge } from './app-badge';
import { messages } from './messages.de-CH';
import { useEdgeSwipeBack } from './use-edge-swipe-back';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Further paths that belong to this tab, so it stays highlighted on its subpages. */
  also?: readonly string[];
  /** «Erfassen» is the main action: its icon sits in a filled circle. */
  primary?: boolean;
}

/**
 * Five tabs (ADR-0031, ADR-0041): Start, Vorrat, ＋ Erfassen in the middle, Wissen, Mehr. Everything else
 * hangs off «Mehr». From 1024 px (iPad landscape, computer) the same list is a sidebar on the left, as
 * on iPadOS (ADR-0092); the order stays, so focus moves the way the eye does.
 */
const navItems: readonly NavItem[] = [
  { to: '/', label: messages.nav.start, icon: House },
  { to: '/inventory', label: messages.nav.inventory, icon: Refrigerator },
  { to: '/add', label: messages.nav.add, icon: Plus, also: ['/inventory/new'], primary: true },
  { to: '/knowledge', label: messages.nav.knowledge, icon: BookOpen },
  { to: '/more', label: messages.nav.more, icon: CircleEllipsis, also: ['/shopping'] },
];

const within = (path: string, base: string) =>
  base === '/' ? path === '/' : path === base || path.startsWith(`${base}/`);

/** The tab a page belongs to: the longest matching path wins, so /inventory/new is «Erfassen». */
function activeTab(path: string): string | undefined {
  const matches = navItems.flatMap(({ to, also = [] }) =>
    [to, ...also].filter((base) => within(path, base)).map((base) => ({ to, base })),
  );
  return matches.sort((a, b) => b.base.length - a.base.length)[0]?.to;
}

export function AppShell() {
  const current = activeTab(useLocation().pathname);
  useAppBadge();
  const page = useRef<HTMLElement>(null);
  useEdgeSwipeBack(page);
  return (
    <div className="min-h-dvh lg:pl-64">
      {/* No brand bar: as on iOS, the large title leads each page (ADR-0021). Content scrolls
          under a frosted strip behind the status bar. */}
      <div
        aria-hidden="true"
        className="sticky top-0 z-10 h-[env(safe-area-inset-top)] bg-oat/80 backdrop-blur [view-transition-name:status-strip]"
      />

      <main
        ref={page}
        className="mx-auto max-w-xl px-4 pt-5 pb-32 md:max-w-2xl lg:max-w-3xl lg:px-8 lg:pt-8 lg:pb-12"
      >
        <Outlet />
      </main>

      <AchievementToast />

      <nav
        aria-label={messages.navLabel}
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur [view-transition-name:tab-bar] lg:inset-y-0 lg:right-auto lg:w-64 lg:border-t-0 lg:border-r lg:pt-[calc(env(safe-area-inset-top)+1.5rem)] lg:pl-[env(safe-area-inset-left)]"
      >
        <div aria-hidden="true" className="hidden items-center gap-3 px-6 pb-6 lg:flex">
          <img src="/icon.svg" alt="" className="size-9 rounded-xl" />
          <span className="font-display text-xl font-semibold">Rettich</span>
        </div>
        <ul className="mx-auto flex max-w-xl md:max-w-2xl lg:max-w-none lg:flex-col lg:gap-1 lg:px-3">
          {navItems.map(({ to, label, icon: Icon, primary = false }) => {
            const isActive = to === current;
            return (
              <li key={to} className={`flex-1 lg:flex-none ${primary ? 'lg:my-2' : ''}`}>
                <Link
                  to={to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-xs transition-colors lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-base ${
                    isActive ? 'font-semibold text-basil-800' : 'font-medium text-ink-muted'
                  } ${
                    primary
                      ? 'lg:bg-onyx lg:font-semibold lg:text-white lg:hover:bg-onyx/90'
                      : isActive
                        ? 'lg:bg-basil-100'
                        : 'lg:hover:bg-oat lg:hover:text-ink'
                  }`}
                >
                  <span
                    className={`flex h-8 items-center justify-center rounded-full transition-colors lg:w-auto lg:bg-transparent ${
                      primary ? 'w-12 bg-onyx text-white' : `w-14 ${isActive ? 'bg-basil-100' : ''}`
                    }`}
                  >
                    <Icon
                      size={22}
                      strokeWidth={primary ? 2.5 : isActive ? 2 : 1.75}
                      aria-hidden="true"
                    />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
