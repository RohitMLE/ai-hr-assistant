import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Badge from './Badge';
import { useAuth } from '../auth/AuthContext';

const links = [
  { label: 'Dashboard', path: '/dashboard', roles: ['employee', 'manager', 'hr_admin'] },
  { label: 'Leave', path: '/leave', roles: ['employee'] },
  { label: 'Attendance', path: '/attendance', roles: ['employee'] },
  { label: 'My Requests', path: '/my-requests', roles: ['employee'] },
  { label: 'Agent Command Center', path: '/agent-command-center', roles: ['employee', 'manager', 'hr_admin'] },
  { label: 'Manager Approvals', path: '/manager/approvals', roles: ['manager'] },
  { label: 'Audit Logs', path: '/audit/logs', roles: ['hr_admin'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleLinks = links.filter((link) => link.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-ink-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-ink-200 px-6">
          <div>
            <p className="text-sm font-bold text-ink-900">Mock HRMS</p>
            <p className="text-xs text-ink-500">Darwinbox-like POC</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
              <div className="mt-1">
                <Badge value={user?.role} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <nav className="flex gap-1 overflow-x-auto lg:hidden">
                {visibleLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
              <button className="btn-secondary" type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
