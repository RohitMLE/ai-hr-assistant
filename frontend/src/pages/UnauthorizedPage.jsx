import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="panel p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">Unauthorized</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">You do not have access to this page.</h1>
        <p className="mt-3 text-sm text-ink-600">
          This mock HRMS enforces role-based access for employee, manager, and HR admin views.
        </p>
        <Link className="btn-primary mt-6" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

