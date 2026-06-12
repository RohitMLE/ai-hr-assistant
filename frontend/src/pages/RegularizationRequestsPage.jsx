import { useEffect, useState } from 'react';
import {
  applyRegularization,
  getMyRegularizationRequests,
  getPendingRegularizationRequests,
  approveRegularization,
  rejectRegularization,
} from '../api/hrms';
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
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    work_date: '2026-05-14',
    issue_type: 'missing_checkin',
    requested_status: 'present',
    reason: '',
  });

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await applyRegularization(form);
      setForm({
        work_date: '2026-05-14',
        issue_type: 'missing_checkin',
        requested_status: 'present',
        reason: '',
      });
      setShowForm(false);
      loadRequests();
    } catch (err) {
      setError(getApiError(err, 'Failed to submit regularization request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">
              {isManager ? 'Manager Approvals: Regularization' : 'My Regularization Requests'}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {isManager 
                ? 'Review and approve attendance regularization requests from your team.' 
                : 'Submit and track attendance correction requests.'}
            </p>
          </div>
          {!isManager ? (
            <button className="btn-primary self-start" type="button" onClick={() => setShowForm((value) => !value)}>
              {showForm ? 'Cancel' : 'New Regularization'}
            </button>
          ) : null}
        </div>
      </header>

      {error ? <Alert>{error}</Alert> : null}

      {!isManager && showForm ? (
        <form className="panel grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-[0.8fr_1fr_1fr_1.5fr_auto]" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs font-bold uppercase text-ink-500">Work Date</span>
            <input
              className="input mt-1"
              type="date"
              value={form.work_date}
              onChange={(event) => setForm({ ...form, work_date: event.target.value })}
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase text-ink-500">Issue Type</span>
            <select
              className="input mt-1"
              value={form.issue_type}
              onChange={(event) => setForm({ ...form, issue_type: event.target.value })}
            >
              <option value="missing_checkin">Missing Check-in</option>
              <option value="missing_checkout">Missing Check-out</option>
              <option value="wrong_status">Wrong Status</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase text-ink-500">Requested Status</span>
            <select
              className="input mt-1"
              value={form.requested_status}
              onChange={(event) => setForm({ ...form, requested_status: event.target.value })}
            >
              <option value="present">Present</option>
              <option value="wfh">WFH</option>
              <option value="half_day">Half Day</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase text-ink-500">Reason</span>
            <input
              className="input mt-1"
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
              placeholder="Missed punch due to..."
              required
            />
          </label>
          <div className="flex items-end">
            <button className="btn-primary w-full whitespace-nowrap" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      ) : null}

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
