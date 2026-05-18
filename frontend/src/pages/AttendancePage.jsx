import { useEffect, useState } from 'react';
import { getAttendanceSummary } from '../api/hrms';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function AttendancePage() {
  const [month, setMonth] = useState('2026-05');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (selectedMonth) => {
    setLoading(true);
    setError('');
    try {
      const data = await getAttendanceSummary(selectedMonth);
      setSummary(data);
    } catch (err) {
      setError(getApiError(err, 'Unable to load attendance summary.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(month);
  }, []);

  const totalDays = summary
    ? Number(summary.working_days || 0) + Number(summary.holiday_days || 0)
    : 0;
  const regularizationRequired = summary
    ? Number(summary.absent_days || 0) + Number(summary.late_days || 0)
    : 0;

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Attendance</h1>
          <p className="mt-1 text-sm text-ink-500">Monthly attendance summary.</p>
        </div>
        <form
          className="flex items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            load(month);
          }}
        >
          <label>
            <span className="text-sm font-semibold text-ink-700">Month</span>
            <input
              className="input mt-1 w-44"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>
          <button className="btn-primary" type="submit" disabled={loading}>
            Refresh
          </button>
        </form>
      </div>

      <div className="mt-6">
        {error ? <Alert>{error}</Alert> : null}
        {loading ? (
          <Loading label="Loading attendance..." />
        ) : summary ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AttendanceMetric label="total_days" value={totalDays} />
            <AttendanceMetric label="present_days" value={summary.present_days} />
            <AttendanceMetric label="absent_days" value={summary.absent_days} />
            <AttendanceMetric label="work_from_home_days" value={0} />
            <AttendanceMetric label="leave_days" value={summary.leave_days} />
            <AttendanceMetric label="late_checkins" value={summary.late_days} />
            <AttendanceMetric label="regularization_required" value={regularizationRequired} />
            <AttendanceMetric label="holidays" value={summary.holiday_days} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AttendanceMetric({ label, value }) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label.replaceAll('_', ' ')}
      </p>
      <p className="mt-3 text-3xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

