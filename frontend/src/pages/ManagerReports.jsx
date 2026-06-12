import { useEffect, useState } from 'react';
import { getTeamAttendanceSummary } from '../api/modules/attendance';
import { getTeamLeaveReports } from '../api/modules/leave';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function ManagerReports() {
  const [month, setMonth] = useState('2026-05');
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [leaveReport, setLeaveReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (selectedMonth) => {
    setLoading(true);
    setError('');
    try {
      const [attendance, leave] = await Promise.all([
        getTeamAttendanceSummary(selectedMonth),
        getTeamLeaveReports()
      ]);
      setAttendanceReport(attendance);
      setLeaveReport(leave);
    } catch (err) {
      setError(getApiError(err, 'Unable to load team reports.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(month);
  }, []);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Manager Reports</h1>
          <p className="mt-1 text-sm text-ink-500">Team attendance and leave summaries.</p>
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
          <Loading label="Loading reports..." />
        ) : (
          <div className="grid gap-8">
            <div className="panel p-5">
              <h2 className="text-lg font-bold text-ink-900 mb-4">Team Attendance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-ink-600">
                  <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium text-center">Present</th>
                      <th className="px-4 py-3 font-medium text-center">Absent</th>
                      <th className="px-4 py-3 font-medium text-center">Late</th>
                      <th className="px-4 py-3 font-medium text-center">WFH</th>
                      <th className="px-4 py-3 font-medium text-center">Overtime</th>
                      <th className="px-4 py-3 font-medium text-center">Comp-Offs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {attendanceReport?.team_summaries.map((item) => (
                      <tr key={item.employee_id} className="hover:bg-ink-50">
                        <td className="px-4 py-3 font-medium text-ink-900">{item.employee_name}</td>
                        <td className="px-4 py-3 text-center">{item.summary.present_days}</td>
                        <td className="px-4 py-3 text-center text-red-600 font-medium">{item.summary.absent_days}</td>
                        <td className="px-4 py-3 text-center">{item.summary.late_days}</td>
                        <td className="px-4 py-3 text-center">{item.summary.wfh_days}</td>
                        <td className="px-4 py-3 text-center">{item.summary.overtime_hours} hrs</td>
                        <td className="px-4 py-3 text-center text-brand-600 font-medium">{item.summary.comp_off_days}</td>
                      </tr>
                    ))}
                    {!attendanceReport?.team_summaries?.length && (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-ink-500">No data available for this month</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="text-lg font-bold text-ink-900 mb-4">Team Leaves (Current & Pending)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-ink-600">
                  <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium text-center">Active/Approved Leaves</th>
                      <th className="px-4 py-3 font-medium text-center">Pending Leave Requests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {leaveReport?.team_reports.map((item) => (
                      <tr key={item.employee_id} className="hover:bg-ink-50">
                        <td className="px-4 py-3 font-medium text-ink-900">{item.employee_name}</td>
                        <td className="px-4 py-3 text-center">{item.active_leaves}</td>
                        <td className="px-4 py-3 text-center font-medium text-yellow-600">{item.pending_leaves}</td>
                      </tr>
                    ))}
                    {!leaveReport?.team_reports?.length && (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-ink-500">No team leave records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
