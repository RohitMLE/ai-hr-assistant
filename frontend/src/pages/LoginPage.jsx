import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import { getApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const roleLanding = {
  employee: '/dashboard',
  manager: '/manager/approvals',
  hr_admin: '/audit/logs',
};

export default function LoginPage() {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={roleLanding[user.role] || '/dashboard'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(form);
      navigate(roleLanding[loggedInUser.role] || '/dashboard', { replace: true });
    } catch (err) {
      setError(getApiError(err, 'Login failed. Check your email and password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-ink-200 bg-white shadow-panel lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-ink-900 px-8 py-10 text-white sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
            Mock Darwinbox-like HRMS
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight">AI HR Assistant POC</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            Securely access employee records, leave workflows, attendance summaries, and HR audit
            activity in a controlled mock environment.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-200">
            <p>Employee: vineet@example.com / password123</p>
            <p>Manager: manager@example.com / password123</p>
            <p>HR Admin: hr@example.com / password123</p>
          </div>
        </div>

        <form className="px-6 py-8 sm:px-10" onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold text-ink-900">Sign in</h2>
          <p className="mt-1 text-sm text-ink-500">Use one of the seeded POC accounts.</p>

          <div className="mt-6 space-y-4">
            {error ? <Alert>{error}</Alert> : null}
            <label className="block">
              <span className="text-sm font-semibold text-ink-700">Email</span>
              <input
                className="input mt-1"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                autoComplete="email"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink-700">Password</span>
              <input
                className="input mt-1"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          <button className="btn-primary mt-6 w-full" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  );
}

