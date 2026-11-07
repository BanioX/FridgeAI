import { CircleEllipsis, House, Plus, Refrigerator, type LucideIcon } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import { messages } from './messages.de-CH';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Further paths that belong to this tab, so it stays highlighted on its subpages. */
  also?: readonly string[];
  /** «Erfassen» is the main action: its icon sits in a filled circle. */
  primary?: boolean;
}

/** Four tabs (ADR-0031): Start, Vorrat, ＋ Erfassen, Mehr. Everything else hangs off «Mehr». */
const navItems: readonly NavItem[] = [
  { to: '/', label: messages.nav.start, icon: House },
  { to: '/inventory', label: messages.nav.inventory, icon: Refrigerator },
  { to: '/add', label: messages.nav.add, icon: Plus, primary: true },
  { to: '/more', label: messages.nav.more, icon: CircleEllipsis, also: ['/shopping'] },
];

const within = (path: string, base: string) =>
  base === '/' ? path === '/' : path === base || path.startsWith(`${base}/`);

export function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-dvh">
      {/* No brand bar: as on iOS, the large title leads each page (ADR-0021). Content scrolls
          under a frosted strip behind the status bar. */}
      <div
        aria-hidden="true"
        className="sticky top-0 z-10 h-[env(safe-area-inset-top)] bg-oat/80 backdrop-blur"
      />

      <main className="mx-auto max-w-xl px-4 pt-5 pb-32">
        <Outlet />
      </main>

      <nav
        aria-label={messages.navLabel}
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex max-w-xl">
          {navItems.map(({ to, label, icon: Icon, also = [], primary = false }) => {
            const isActive = [to, ...also].some((base) => within(pathname, base));
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-xs transition-colors ${
                    isActive ? 'font-semibold text-basil-800' : 'font-medium text-ink-muted'
                  }`}
                >
                  <span
                    className={`flex h-8 items-center justify-center rounded-full transition-colors ${
                      primary
                        ? 'w-12 bg-basil-700 text-white'
                        : `w-14 ${isActive ? 'bg-basil-100' : ''}`
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
