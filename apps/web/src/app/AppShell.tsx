import { NavLink, Outlet } from 'react-router';
import { messages } from './messages.de-CH';

const navItems = [
  { to: '/', label: messages.nav.today, end: true },
  { to: '/inventory', label: messages.nav.inventory, end: false },
  { to: '/scan', label: messages.nav.scan, end: false },
  { to: '/shopping', label: messages.nav.shopping, end: false },
  { to: '/household', label: messages.nav.household, end: false },
] as const;

const linkBase =
  'flex min-h-11 flex-1 items-center justify-center px-2 text-sm font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green-800';

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      <header className="bg-green-800 px-4 py-3 text-lg font-semibold text-white">
        {messages.appName}
      </header>
      <main className="flex-1 px-4 py-6 pb-24">
        <Outlet />
      </main>
      <nav
        aria-label={messages.navLabel}
        className="fixed inset-x-0 bottom-0 flex border-t border-neutral-300 bg-white"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-green-100 font-bold text-green-900' : 'text-neutral-800'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
