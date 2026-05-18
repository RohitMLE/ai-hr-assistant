import { useEffect, useState } from 'react';
import { getMyLeaveRequests } from '../api/hrms';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { formatDate, formatDateTime, titleize } from '../utils/format';

export default function MyRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyLeaveRequests()
      .then((data) => setRequests(data.items))
      .catch((err) => setError(getApiError(err, 'Unable to load leave requests.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h1 className="text-2xl font-bold text-ink-900">My Requests</h1>
      <p className="mt-1 text-sm text-ink-500">All leave requests submitted by you.</p>

      <div className="mt-6">
        {error ? <Alert>{error}</Alert> : null}
        {loading ? (
          <Loading label="Loading requests..." />
        ) : requests.length === 0 ? (
          <EmptyState title="No leave requests" message="Your requests will appear here." />
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-200 text-sm">
                <thead className="bg-ink-50">
                  <tr>
                    {['ID', 'leave_type', 'from_date', 'to_date', 'reason', 'status', 'created_at'].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500"
                        >
                          {heading.replaceAll('_', ' ')}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200 bg-white">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-4 py-3 font-semibold text-ink-900">{request.id}</td>
                      <td className="px-4 py-3 text-ink-700">{titleize(request.leave_type)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(request.start_date)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(request.end_date)}</td>
                      <td className="max-w-xs px-4 py-3 text-ink-700">
                        {request.reason || 'No reason provided'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={request.status} />
                      </td>
                      <td className="px-4 py-3 text-ink-700">{formatDateTime(request.created_at)}</td>
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

