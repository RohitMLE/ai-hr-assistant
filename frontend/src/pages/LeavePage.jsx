import { useEffect, useState } from 'react';
import { applyLeave, getLeaveBalance, getMyLeaveRequests } from '../api/hrms';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { formatDate, pluralizeDays, titleize } from '../utils/format';

const leaveTypes = ['casual_leave', 'sick_leave', 'earned_leave', 'comp_off'];

export default function LeavePage() {
  const [balance, setBalance] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    leave_type: 'casual_leave',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setError('');
    const [balanceData, requestsData] = await Promise.all([getLeaveBalance(), getMyLeaveRequests()]);
    setBalance(balanceData.balances);
    setRequests(requestsData.items);
  };

  useEffect(() => {
    load()
      .catch((err) => setError(getApiError(err, 'Unable to load leave data.')))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await applyLeave(form);
      setSuccess('Leave request submitted for manager approval.');
      setForm({ leave_type: 'casual_leave', start_date: '', end_date: '', reason: '' });
      await load();
    } catch (err) {
      setError(getApiError(err, 'Unable to submit leave request.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading label="Loading leave data..." />;

  return (
    <section>
      <h1 className="text-2xl font-bold text-ink-900">Leave</h1>
      <p className="mt-1 text-sm text-ink-500">Apply leave and track approval status.</p>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="panel p-5">
            <h2 className="text-base font-bold text-ink-900">Leave Balance</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {balance.map((item) => (
                <div key={item.leave_type} className="rounded-md border border-ink-200 p-3">
                  <p className="text-sm font-semibold text-ink-700">{titleize(item.leave_type)}</p>
                  <p className="mt-2 text-xl font-bold text-ink-900">
                    {pluralizeDays(item.remaining_days)} remaining
                  </p>
                  <p className="text-xs text-ink-500">
                    {pluralizeDays(item.used_days)} used of {pluralizeDays(item.total_days)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form className="panel p-5" onSubmit={handleSubmit}>
            <h2 className="text-base font-bold text-ink-900">Apply Leave</h2>
            <div className="mt-4 space-y-4">
              {error ? <Alert>{error}</Alert> : null}
              {success ? <Alert type="success">{success}</Alert> : null}
              <label className="block">
                <span className="text-sm font-semibold text-ink-700">Leave type</span>
                <select
                  className="input mt-1"
                  value={form.leave_type}
                  onChange={(event) => setForm({ ...form, leave_type: event.target.value })}
                >
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>
                      {titleize(type)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-ink-700">From date</span>
                  <input
                    className="input mt-1"
                    type="date"
                    value={form.start_date}
                    onChange={(event) => setForm({ ...form, start_date: event.target.value })}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-ink-700">To date</span>
                  <input
                    className="input mt-1"
                    type="date"
                    value={form.end_date}
                    onChange={(event) => setForm({ ...form, end_date: event.target.value })}
                    required
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-ink-700">Reason</span>
                <textarea
                  className="input mt-1 min-h-24"
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  placeholder="Add a brief reason"
                />
              </label>
            </div>
            <button className="btn-primary mt-5 w-full" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Leave'}
            </button>
          </form>
        </div>

        <RequestsPanel requests={requests} />
      </div>
    </section>
  );
}

function RequestsPanel({ requests }) {
  return (
    <div className="panel p-5">
      <h2 className="text-base font-bold text-ink-900">My Requests</h2>
      <div className="mt-4 space-y-3">
        {requests.length === 0 ? (
          <EmptyState title="No requests yet" message="Apply leave to create your first request." />
        ) : (
          requests.map((request) => (
            <div key={request.id} className="rounded-md border border-ink-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{titleize(request.leave_type)}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {formatDate(request.start_date)} to {formatDate(request.end_date)}
                  </p>
                </div>
                <Badge value={request.status} />
              </div>
              <p className="mt-3 text-sm text-ink-600">{request.reason || 'No reason provided'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

