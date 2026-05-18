import { useEffect, useState } from 'react';
import { getAuditLogs } from '../api/hrms';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { formatDateTime, titleize } from '../utils/format';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAuditLogs()
      .then((data) => setLogs(data.items))
      .catch((err) => setError(getApiError(err, 'Unable to load audit logs.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h1 className="text-2xl font-bold text-ink-900">Audit Logs</h1>
      <p className="mt-1 text-sm text-ink-500">HR admin audit trail for leave actions.</p>

      <div className="mt-6">
        {error ? <Alert>{error}</Alert> : null}
        {loading ? (
          <Loading label="Loading audit logs..." />
        ) : logs.length === 0 ? (
          <EmptyState title="No audit logs" message="System activity will appear here." />
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-200 text-sm">
                <thead className="bg-ink-50">
                  <tr>
                    {['ID', 'Actor', 'Action', 'Target', 'Details', 'Created'].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200 bg-white">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 font-semibold text-ink-900">{log.id}</td>
                      <td className="px-4 py-3 text-ink-700">User {log.actor_user_id}</td>
                      <td className="px-4 py-3 text-ink-700">{titleize(log.action)}</td>
                      <td className="px-4 py-3 text-ink-700">
                        {log.target_type} {log.target_id ? `#${log.target_id}` : ''}
                      </td>
                      <td className="max-w-md px-4 py-3 text-xs text-ink-600">{log.details || '-'}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDateTime(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

