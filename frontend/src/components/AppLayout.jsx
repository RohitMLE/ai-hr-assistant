import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Badge from './Badge';
import { useAuth } from '../auth/AuthContext';

const links = [
  { label: 'Dashboard', path: '/dashboard', roles: ['employee', 'manager', 'hr_admin'] },
  { label: 'Core HR', path: '/core-hr', roles: ['hr_admin', 'manager'] },
  { label: 'Employee Master', path: '/core-hr/employees', roles: ['hr_admin', 'manager'] },
  { label: 'Recruitment', path: '/recruitment', roles: ['hr_admin', 'manager'] },
  { label: 'Onboarding', path: '/onboarding', roles: ['hr_admin', 'manager'] },
  { label: 'Attendance', path: '/attendance', roles: ['employee'] },
  { label: 'Leave', path: '/leave', roles: ['employee'] },
  { label: 'My Payslips', path: '/my-payslips', roles: ['employee', 'manager', 'hr_admin'] },
  { label: 'My Travel', path: '/expenses/my-travel', roles: ['employee', 'manager', 'hr_admin'] },
  { label: 'My Expenses', path: '/expenses/my-claims', roles: ['employee', 'manager', 'hr_admin'] },
  { label: 'Culture Hub', path: '/culture-hub', roles: ['employee', 'manager', 'hr_admin'] },
  { label: 'Growth Hub', path: '/growth-hub', roles: ['employee', 'manager', 'hr_admin'] },
  { label: 'Employee Services', path: '/employee-services', roles: ['employee', 'manager', 'hr_admin'] },
  { label: 'Regularization', path: '/regularization-requests', roles: ['employee', 'manager'] },
  { label: 'Manager Approvals', path: '/manager/approvals', roles: ['manager'] },
  { label: 'Manager Appraisals', path: '/manager-appraisals', roles: ['manager'] },
  { label: 'Exit Management', path: '/exit-management', roles: ['manager', 'hr_admin'] },
  { label: 'Expense Approvals', path: '/expenses/manager-approvals', roles: ['manager'] },
  { label: 'Finance Desk', path: '/expenses/finance-desk', roles: ['hr_admin'] },
  { label: 'IT Admin Desk', path: '/it-admin-desk', roles: ['hr_admin'] },
  { label: 'Agent Command Center', path: '/agent-command-center', roles: ['employee', 'manager', 'hr_admin'] },
  { label: 'Manager Approvals', path: '/manager/approvals', roles: ['manager'] },
  { label: 'Manager Reports', path: '/manager/reports', roles: ['manager', 'hr_admin'] },
  { label: 'Payroll Processing', path: '/payroll/runs', roles: ['hr_admin'] },
  { label: 'Payroll Config', path: '/payroll/config', roles: ['hr_admin'] },
  { label: 'Audit Logs', path: '/audit/logs', roles: ['hr_admin'] },
  { label: 'Workforce Planning', path: '/workforce-planning', roles: ['hr_admin', 'manager'] },
  { label: 'Analytics', path: '/analytics', roles: ['hr_admin', 'manager'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleLinks = links.filter((link) => link.roles.includes(user?.role));
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
        <nav className="space-y-1 px-3 py-4 overflow-y-auto h-[calc(100vh-4rem)] pb-10">
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
              
              <div className="relative mx-4">
                <button className="text-ink-600 hover:text-ink-900 focus:outline-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                </button>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{unreadCount}</span>
                )}
              </div>

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
