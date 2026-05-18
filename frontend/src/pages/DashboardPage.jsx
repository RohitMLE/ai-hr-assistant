import { useEffect, useState } from 'react';
import { getAttendanceSummary, getEmployeeMe, getLeaveBalance, getMyLeaveRequests } from '../api/hrms';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { useAuth } from '../auth/AuthContext';
import { formatDate, formatDateTime, pluralizeDays, titleize } from '../utils/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        if (user.role === 'employee') {
          const [profile, balance, attendance, requests] = await Promise.all([
            getEmployeeMe(),
            getLeaveBalance(),
            getAttendanceSummary('2026-05'),
            getMyLeaveRequests(),
          ]);
          if (!cancelled) setData({ profile, balance, attendance, requests });
        } else {
          const profile = await getEmployeeMe();
          if (!cancelled) setData({ profile });
        }
      } catch (err) {
        if (!cancelled) setError(getApiError(err, 'Unable to load dashboard.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user.role]);

  if (loading) return <Loading label="Loading dashboard..." />;

  if (error) return <Alert>{error}</Alert>;

  if (user.role !== 'employee') {
    return (
      <section>
        <PageTitle title="Dashboard" subtitle="Role overview for the mock HRMS workspace." />
        <div className="panel mt-6 p-6">
          <p className="text-sm font-semibold text-ink-900">{data.profile.name}</p>
          <p className="mt-1 text-sm text-ink-500">
            {data.profile.employee_code} · {data.profile.department}
          </p>
          <div className="mt-4">
            <Badge value={data.profile.role} />
          </div>
        </div>
      </section>
    );
  }

  const recentRequests = data.requests.items.slice(0, 4);

  return (
    <section>
      <PageTitle title="Dashboard" subtitle="Employee HR snapshot for May 2026." />
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-base font-bold text-ink-900">Employee Profile</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Info label="Name" value={data.profile.name} />
            <Info label="Employee Code" value={data.profile.employee_code} />
            <Info label="Department" value={data.profile.department} />
            <Info label="Joined" value={formatDate(data.profile.date_of_joining)} />
          </dl>
        </div>

        <div className="panel p-5">
          <h2 className="text-base font-bold text-ink-900">Leave Balance</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.balance.balances.map((item) => (
              <div key={item.leave_type} className="rounded-md border border-ink-200 p-3">
                <p className="text-sm font-semibold text-ink-700">{titleize(item.leave_type)}</p>
                <p className="mt-2 text-2xl font-bold text-ink-900">
                  {pluralizeDays(item.remaining_days)}
                </p>
                <p className="text-xs text-ink-500">Used {pluralizeDays(item.used_days)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-base font-bold text-ink-900">Attendance Summary</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label="Working" value={data.attendance.working_days} />
            <Metric label="Present" value={data.attendance.present_days} />
            <Metric label="Absent" value={data.attendance.absent_days} />
            <Metric label="Leave" value={data.attendance.leave_days} />
            <Metric label="Late" value={data.attendance.late_days} />
            <Metric label="Holiday" value={data.attendance.holiday_days} />
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-base font-bold text-ink-900">Recent Leave Requests</h2>
          <div className="mt-4 space-y-3">
            {recentRequests.length === 0 ? (
              <EmptyState title="No leave requests" message="Submitted requests will appear here." />
            ) : (
              recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-ink-200 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {titleize(request.leave_type)}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {formatDate(request.start_date)} to {formatDate(request.end_date)} ·{' '}
                      {formatDateTime(request.created_at)}
                    </p>
                  </div>
                  <Badge value={request.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PageTitle({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
      <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink-900">{value || '-'}</dd>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-ink-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

