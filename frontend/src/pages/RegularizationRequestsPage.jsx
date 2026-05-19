import { useEffect, useState } from 'react';
import { getMyRegularizationRequests, getPendingRegularizationRequests, approveRegularization, rejectRegularization } from '../api/hrms';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { formatDate, formatDateTime, titleize } from '../utils/format';
import { useAuth } from '../auth/AuthContext';

export default function RegularizationRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const isManager = user?.role === 'manager';

  const loadRequests = () => {
    setLoading(true);
    const fetchFn = isManager ? getPendingRegularizationRequests : getMyRegularizationRequests;
    
    fetchFn()
      .then((data) => setRequests(data.items))
      .catch((err) => setError(getApiError(err, 'Unable to load regularization requests.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, [isManager]);

  const handleAction = async (requestId, action) => {
    const comment = prompt(`Enter comment for ${action}:`) || (action === 'approve' ? 'Approved' : 'Rejected');
    setActionLoading(requestId);
    setError('');

    try {
      const actionFn = action === 'approve' ? approveRegularization : rejectRegularization;
      await actionFn(requestId, comment);
      loadRequests();
    } catch (err) {
      setError(getApiError(err, `Failed to ${action} request.`));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">
          {isManager ? 'Manager Approvals: Regularization' : 'My Regularization Requests'}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {isManager 
            ? 'Review and approve attendance regularization requests from your team.' 
            : 'Track the status of your submitted attendance regularization requests.'}
        </p>
      </header>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <Loading label="Loading requests..." />
      ) : requests.length === 0 ? (
        <EmptyState 
          title="No regularization requests" 
          message={isManager ? "No pending regularization requests to review." : "You haven't submitted any regularization requests yet."} 
        />
      ) : (
        <div className="panel overflow-hidden border-ink-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-200 text-sm">
              <thead className="bg-ink-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500">ID</th>
                  {isManager && <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500">Employee</th>}
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500">Issue Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500">Requested Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500">Created At</th>
                  {isManager && <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-ink-500">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200 bg-white">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-ink-25 transition-colors">
                    <td className="px-4 py-4 font-semibold text-ink-900">#{request.id}</td>
                    {isManager && <td className="px-4 py-4 text-ink-700">{request.employee_name}</td>}
                    <td className="px-4 py-4 text-ink-700 whitespace-nowrap">{formatDate(request.work_date)}</td>
                    <td className="px-4 py-4 text-ink-700">{titleize(request.issue_type)}</td>
                    <td className="px-4 py-4 text-ink-700">
                      <span className="font-medium text-brand-700">{titleize(request.requested_status)}</span>
                    </td>
                    <td className="px-4 py-4 text-ink-600 max-w-xs truncate" title={request.reason}>
                      {request.reason}
                    </td>
                    <td className="px-4 py-4">
                      <Badge value={request.status} />
                    </td>
                    <td className="px-4 py-4 text-ink-500 text-xs">{formatDateTime(request.created_at)}</td>
                    {isManager && (
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn-primary py-1 px-3 text-xs bg-emerald-600 border-emerald-700 hover:bg-emerald-700"
                            onClick={() => handleAction(request.id, 'approve')}
                            disabled={actionLoading !== null}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-secondary py-1 px-3 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                            onClick={() => handleAction(request.id, 'reject')}
                            disabled={actionLoading !== null}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
