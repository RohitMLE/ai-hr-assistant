import { useEffect, useState } from 'react';
import { approveLeave, getPendingLeaveRequests, rejectLeave } from '../api/hrms';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { formatDate, titleize } from '../utils/format';

export default function ManagerApprovalsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    const data = await getPendingLeaveRequests();
    setRequests(data.items);
  };

  useEffect(() => {
    load()
      .catch((err) => setError(getApiError(err, 'Unable to load manager approvals.')))
      .finally(() => setLoading(false));
  }, []);

  const act = async (request, action) => {
    setActingId(request.id);
    setError('');
    setSuccess('');
    try {
      if (action === 'approve') {
        await approveLeave(request.id, 'Approved from manager dashboard');
        setSuccess(`Leave request #${request.id} approved.`);
      } else {
        await rejectLeave(request.id, 'Rejected from manager dashboard');
        setSuccess(`Leave request #${request.id} rejected.`);
      }
      await load();
    } catch (err) {
      setError(getApiError(err, `Unable to ${action} leave request.`));
    } finally {
      setActingId(null);
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-bold text-ink-900">Manager Approvals</h1>
      <p className="mt-1 text-sm text-ink-500">Review pending leave requests assigned to you.</p>

      <div className="mt-6 space-y-4">
        {error ? <Alert>{error}</Alert> : null}
        {success ? <Alert type="success">{success}</Alert> : null}
        {loading ? (
          <Loading label="Loading approvals..." />
        ) : requests.length === 0 ? (
          <EmptyState title="No pending approvals" message="New leave requests will appear here." />
        ) : (
          requests.map((request) => (
            <div key={request.id} className="panel p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-bold text-ink-900">
                      Request #{request.id} · {titleize(request.leave_type)}
                    </h2>
                    <Badge value={request.status} />
                  </div>
                  <p className="mt-2 text-sm text-ink-600">
                    Employee ID {request.employee_id} · {formatDate(request.start_date)} to{' '}
                    {formatDate(request.end_date)} · {request.days} day(s)
                  </p>
                  <p className="mt-2 text-sm text-ink-700">
                    {request.reason || 'No reason provided'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-primary"
                    type="button"
                    disabled={actingId === request.id}
                    onClick={() => act(request, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    disabled={actingId === request.id}
                    onClick={() => act(request, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

