import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEmployees } from '../api/modules/coreHr';
import Badge from '../components/Badge';

export default function EmployeeListPage() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    listEmployees(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Employee Master</h1>
          <p className="text-sm text-ink-500">{data.total} employees</p>
        </div>
        <Link to="/core-hr/employees/add" className="btn-primary self-start sm:self-auto">
          + Add Employee
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or employee code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-ink-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-80"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50">
              <th className="px-4 py-3 text-left font-semibold text-ink-700">Employee</th>
              <th className="px-4 py-3 text-left font-semibold text-ink-700">Code</th>
              <th className="px-4 py-3 text-left font-semibold text-ink-700">Department</th>
              <th className="px-4 py-3 text-left font-semibold text-ink-700">Designation</th>
              <th className="px-4 py-3 text-left font-semibold text-ink-700">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-ink-700">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-400">
                  Loading…
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-400">
                  No employees found.
                </td>
              </tr>
            ) : (
              data.items.map((emp) => (
                <tr key={emp.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{emp.name}</div>
                    <div className="text-xs text-ink-400">{emp.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-600">{emp.employee_code}</td>
                  <td className="px-4 py-3 text-ink-600">{emp.department?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-600">{emp.designation?.title ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge value={emp.role} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        emp.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/core-hr/employees/${emp.id}`}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
