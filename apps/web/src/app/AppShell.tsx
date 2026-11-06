import { House, ListChecks, Refrigerator, ScanLine, Sun, type LucideIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { messages } from './messages.de-CH';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

const navItems: readonly NavItem[] = [
  { to: '/', label: messages.nav.today, icon: Sun, end: true },
  { to: '/inventory', label: messages.nav.inventory, icon: Refrigerator, end: false },
  { to: '/scan', label: messages.nav.scan, icon: ScanLine, end: false },
  { to: '/shopping', label: messages.nav.shopping, icon: ListChecks, end: false },
  { to: '/household', label: messages.nav.household, icon: House, end: false },
];

export function AppShell() {
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
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-xs transition-colors ${
                    isActive ? 'font-semibold text-basil-800' : 'font-medium text-ink-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                        isActive ? 'bg-basil-100' : ''
                      }`}
                    >
                      <Icon size={22} strokeWidth={isActive ? 2 : 1.75} aria-hidden="true" />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
