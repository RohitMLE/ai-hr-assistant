import { useEffect, useState } from 'react';
import { getAttendanceSummary, clockIn, clockOut } from '../api/modules/attendance';
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

  const handleClockIn = async () => {
    try {
      await clockIn();
      alert('Clocked in successfully');
      load(month);
    } catch (err) {
      alert(getApiError(err, 'Failed to clock in'));
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut();
      alert('Clocked out successfully');
      load(month);
    } catch (err) {
      alert(getApiError(err, 'Failed to clock out'));
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

      <div className="mt-6 panel p-5 flex items-center justify-between border-l-4 border-brand-500">
        <div>
          <h2 className="text-lg font-bold text-ink-900">Today's Attendance</h2>
          <p className="text-sm text-ink-500">Punch in and out for your daily shift.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn-primary" onClick={handleClockIn}>Clock In</button>
          <button className="btn-outline" onClick={handleClockOut}>Clock Out</button>
        </div>
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
            <AttendanceMetric label="work_from_home_days" value={summary.wfh_days || 0} />
            <AttendanceMetric label="overtime_hours" value={summary.overtime_hours || 0} />
            <AttendanceMetric label="comp_off_days" value={summary.comp_off_days || 0} />
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

