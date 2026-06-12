import { useMemo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sendAgentMessage } from '../api/hrms';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { useAuth } from '../auth/AuthContext';

const suggestionsByRole = {
  employee: [
    { label: 'Check Leave Balance', goal: 'How many leaves do I have?' },
    { label: 'View May Attendance', goal: 'Show my attendance for May 2026' },
    { label: 'Apply Casual Leave', goal: 'Apply casual leave for 2026-05-24 because family work' },
    { label: 'My Leave Requests', goal: 'Show my leave requests' },
    { label: 'Missed Check-in', goal: 'Regularize 2026-05-14 as present because I forgot to punch in' },
  ],
  manager: [
    { label: 'All Employees', goal: 'Show me all employees' },
    { label: 'Search Employee', goal: 'Find employee named Vineet' },
    { label: 'Pending Approvals', goal: 'Show pending leave approvals' },
    { label: 'Pending Regularization', goal: 'Show pending attendance regularization requests' },
    { label: 'Approve Regularization', goal: "Approve Vineet's attendance regularization" },
  ],
  hr_admin: [
    { label: 'All Employees', goal: 'Show me all employees' },
    { label: 'Employee Profile', goal: 'Get the full profile for employee 3' },
    { label: 'Search Employee', goal: 'Find employees in Engineering department' },
    { label: 'Check My Leaves', goal: 'How many leaves do I have?' },
    { label: 'HR Policies', goal: 'What is the work from home policy?' },
  ],
};

export default function AgentCommandCenterPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState('');
  const [currentRun, setCurrentRun] = useState(null);
  const [recentRuns, setRecentRuns] = useState(() => {
    const saved = localStorage.getItem('recent_agent_runs');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('recent_agent_runs', JSON.stringify(recentRuns.slice(0, 10)));
  }, [recentRuns]);

  const suggestions = useMemo(() => suggestionsByRole[user?.role] || [], [user?.role]);

  const startGoal = async (targetGoal) => {
    const message = targetGoal.trim();
    if (!message || loading) return;

    setGoal('');
    setError('');
    setLoading(true);

    const newRun = {
      id: Date.now(),
      goal: message,
      status: 'running',
      steps: [],
      outcome: null,
      data: null,
      primaryTool: null,
      requiresConfirmation: false,
      pendingActionId: null,
      timestamp: new Date().toISOString(),
    };
    setCurrentRun(newRun);

    try {
      const response = await sendAgentMessage(message);

      const steps = (response.tool_calls || []).map((tc) => ({
        name: tc.tool_name,
        status: tc.status,
      }));

      const updatedRun = {
        ...newRun,
        status: response.requires_confirmation ? 'interrupted' : 'success',
        outcome: response.reply,
        requiresConfirmation: response.requires_confirmation,
        pendingActionId: response.pending_action_id,
        data: response.data,
        primaryTool: steps[0]?.name || null,
        steps,
      };

      setCurrentRun(updatedRun);
      if (!response.requires_confirmation) {
        setRecentRuns((prev) => [updatedRun, ...prev]);
      }
    } catch (err) {
      const failedRun = {
        ...newRun,
        status: 'error',
        outcome: getApiError(err, 'Agent execution failed.'),
      };
      setCurrentRun(failedRun);
      setRecentRuns((prev) => [failedRun, ...prev]);
      setError(getApiError(err, 'Agent request failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (choice) => {
    if (!currentRun || loading) return;
    setLoading(true);
    setError('');
    setCurrentRun((prev) => ({ ...prev, status: 'running' }));

    try {
      const response = await sendAgentMessage(choice);
      const finalRun = {
        ...currentRun,
        status: 'success',
        outcome: response.reply,
        requiresConfirmation: false,
        pendingActionId: null,
        data: response.data,
      };
      setCurrentRun(finalRun);
      setRecentRuns((prev) => [finalRun, ...prev]);
    } catch (err) {
      setError(getApiError(err, 'Confirmation failed.'));
      setCurrentRun((prev) => ({ ...prev, status: 'error', outcome: 'Confirmation failed.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Agent Command Center</h1>
        <p className="text-ink-500">
          Orchestrate HR tasks through autonomous agent execution and tool-calling.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* Goal Input */}
          <section className="panel p-6 bg-gradient-to-br from-white to-ink-50 shadow-lg border-brand-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-400 mb-4">Set Agent Objective</h2>
            <form
              className="flex gap-3"
              onSubmit={(e) => { e.preventDefault(); startGoal(goal); }}
            >
              <input
                ref={inputRef}
                className="input text-lg py-6 flex-1 shadow-inner border-ink-200 focus:border-brand-500"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Show me all employees, or get the profile for employee 3…"
                disabled={loading}
              />
              <button
                className="btn-primary px-8 text-lg font-bold shadow-brand"
                type="submit"
                disabled={loading || !goal.trim()}
              >
                {loading ? 'Executing…' : 'Run Agent'}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-medium text-ink-400 self-center mr-2">Quick Goals:</span>
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  className="px-3 py-1.5 rounded-full border border-ink-200 bg-white text-xs font-semibold text-ink-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all shadow-sm"
                  onClick={() => startGoal(s.goal)}
                  disabled={loading}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {/* Active Run */}
          {currentRun && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink-900">Active Agent Run</h3>
                <Badge value={currentRun.status} />
              </div>

              <div className="space-y-4">
                {/* Tool Activity strip */}
                {currentRun.steps.length > 0 && (
                  <div className="panel p-4 border-l-4 border-l-brand-500">
                    <h4 className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-3">Tool Activity</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentRun.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 rounded bg-ink-50 border border-ink-100 px-3 py-1.5">
                          <code className="text-xs font-mono text-brand-700">{step.name}()</code>
                          <Badge value={step.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmation panel */}
                {currentRun.requiresConfirmation && (
                  <div className="panel p-5 bg-amber-50 border-amber-200 ring-1 ring-amber-500/20">
                    <div className="flex items-center gap-2 mb-3 text-amber-800">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h4 className="font-bold">Human Approval Required</h4>
                    </div>
                    <p className="text-sm text-amber-900 mb-5 leading-relaxed whitespace-pre-line">
                      {currentRun.outcome}
                    </p>
                    <div className="flex gap-3">
                      <button
                        className="btn-primary bg-amber-600 hover:bg-amber-700 border-amber-700 flex-1 py-3"
                        onClick={() => handleConfirmation('confirm')}
                        disabled={loading}
                      >
                        Confirm Action
                      </button>
                      <button
                        className="btn-secondary border-amber-300 text-amber-700 hover:bg-amber-100 flex-1"
                        onClick={() => handleConfirmation('cancel')}
                        disabled={loading}
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}

                {/* Text reply */}
                {currentRun.outcome && !currentRun.requiresConfirmation && (
                  <div className="panel p-5 bg-white border-t-4 border-t-emerald-500">
                    <h4 className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-3">Agent Reply</h4>
                    <div className="prose prose-sm max-w-none text-ink-800 font-medium whitespace-pre-line leading-relaxed">
                      {currentRun.outcome}
                    </div>
                  </div>
                )}

                {/* Structured data render */}
                {currentRun.data && currentRun.primaryTool && !currentRun.requiresConfirmation && (
                  <StructuredDataPanel tool={currentRun.primaryTool} data={currentRun.data} />
                )}

                {error && <Alert>{error}</Alert>}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: History */}
        <aside className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-ink-400">Recent Runs</h3>
            <button
              className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase"
              onClick={() => setRecentRuns([])}
            >
              Clear
            </button>
          </div>

          <div className="space-y-4">
            {recentRuns.length === 0 ? (
              <div className="panel p-8 text-center bg-ink-50 border-dashed border-2">
                <p className="text-xs text-ink-400 font-medium uppercase tracking-tight">No execution history</p>
              </div>
            ) : (
              recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="panel p-4 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setCurrentRun(run)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge value={run.status} />
                    <span className="text-[10px] font-medium text-ink-400">
                      {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-ink-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
                    {run.goal}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Structured Data Renderer ──────────────────────────────────────────────────

function StructuredDataPanel({ tool, data }) {
  if (tool === 'search_employees' && data.employees) {
    return <EmployeeTable employees={data.employees} total={data.total} />;
  }
  if (tool === 'get_employee_profile' && data.id) {
    return <EmployeeProfileCard emp={data} />;
  }
  if (tool === 'get_leave_balance' && data.balances) {
    return <LeaveBalanceCards balances={data.balances} />;
  }
  if (tool === 'get_my_leave_requests' && data.items) {
    return <LeaveRequestList items={data.items} />;
  }
  if ((tool === 'get_pending_leave_approvals') && data.items) {
    return <LeaveRequestList items={data.items} showEmployee />;
  }
  if (tool === 'get_attendance_summary') {
    return <AttendanceSummary data={data} />;
  }
  if (tool === 'get_pending_regularization_requests' && data.items) {
    return <RegularizationList items={data.items} />;
  }
  if (tool === 'get_my_payslip' && data.month) {
    return <PayslipCard data={data} />;
  }
  if (tool === 'search_hr_policies' && data.policies) {
    return <PolicyList policies={data.policies} />;
  }
  if (tool === 'get_org_hierarchy') {
    return <OrgHierarchy data={data} />;
  }
  if (tool === 'get_recruitment_summary') {
    return <RecruitmentSummary data={data} />;
  }
  return null;
}

// ── Employee Table ────────────────────────────────────────────────────────────

function EmployeeTable({ employees, total }) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50 px-4 py-3">
        <h4 className="text-sm font-semibold text-ink-700">Employees</h4>
        <span className="text-xs text-ink-400">{total} total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="px-4 py-2 text-left text-xs font-semibold text-ink-500">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-ink-500">Code</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-ink-500">Department</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-ink-500">Role</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-ink-500">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-ink-50">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-ink-900">{emp.name}</div>
                  <div className="text-xs text-ink-400">{emp.email}</div>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-ink-500">{emp.employee_code}</td>
                <td className="px-4 py-2.5 text-ink-600">{emp.department || '—'}</td>
                <td className="px-4 py-2.5">
                  <Badge value={emp.role} />
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {emp.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link to={`/core-hr/employees/${emp.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Employee Profile Card ─────────────────────────────────────────────────────

function EmployeeProfileCard({ emp }) {
  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-base font-bold text-ink-900">{emp.name}</h4>
          <p className="text-sm text-ink-500">{emp.designation} · {emp.department}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-xs text-ink-400">{emp.employee_code}</span>
            <Badge value={emp.role} />
          </div>
        </div>
        <Link to={`/core-hr/employees/${emp.id}`} className="btn-secondary text-xs">
          Full Profile →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ink-100 pt-4 text-sm">
        <ProfileField label="Email" value={emp.email} />
        <ProfileField label="Phone" value={emp.phone} />
        <ProfileField label="Manager" value={emp.manager} />
        <ProfileField label="Work Location" value={emp.work_location} />
        <ProfileField label="Employment Type" value={emp.employment_type} />
        <ProfileField label="Date of Joining" value={emp.date_of_joining} />
        <ProfileField label="Gender" value={emp.gender} />
        <ProfileField label="Date of Birth" value={emp.date_of_birth} />
      </div>

      {emp.emergency_contacts?.length > 0 && (
        <div className="border-t border-ink-100 pt-3">
          <p className="mb-2 text-xs font-semibold text-ink-500">Emergency Contact</p>
          {emp.emergency_contacts.map((c, i) => (
            <p key={i} className="text-sm text-ink-700">{c.name} ({c.relationship}) · {c.phone}</p>
          ))}
        </div>
      )}

      {emp.job_history?.length > 0 && (
        <div className="border-t border-ink-100 pt-3">
          <p className="mb-2 text-xs font-semibold text-ink-500">Prior Experience</p>
          {emp.job_history.map((h, i) => (
            <p key={i} className="text-sm text-ink-700">{h.title} at {h.company} ({h.from} – {h.to || 'Present'})</p>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="font-medium text-ink-800">{value || '—'}</p>
    </div>
  );
}

// ── Leave Balance Cards ───────────────────────────────────────────────────────

function LeaveBalanceCards({ balances }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {balances.map((b) => (
        <div key={b.leave_type} className="panel p-4 text-center">
          <p className="text-2xl font-extrabold text-brand-700">{b.remaining_days}</p>
          <p className="mt-1 text-xs font-medium text-ink-500">{b.leave_type.replace(/_/g, ' ')}</p>
          <p className="text-xs text-ink-400">{b.used_days} used / {b.total_days} total</p>
        </div>
      ))}
    </div>
  );
}

// ── Leave Request List ────────────────────────────────────────────────────────

function LeaveRequestList({ items, showEmployee = false }) {
  if (!items.length) return <EmptyData message="No leave requests found." />;
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-ink-100 bg-ink-50 px-4 py-3">
        <h4 className="text-sm font-semibold text-ink-700">Leave Requests</h4>
      </div>
      <div className="divide-y divide-ink-50">
        {items.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <div>
              {showEmployee && <p className="text-xs font-semibold text-brand-700">{r.employee_name}</p>}
              <p className="text-sm font-medium text-ink-900">{r.leave_type?.replace(/_/g, ' ')}</p>
              <p className="text-xs text-ink-400">{r.start_date} → {r.end_date} · {r.days} day(s)</p>
              {r.reason && <p className="text-xs text-ink-500 italic">{r.reason}</p>}
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(r.status)}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Attendance Summary ────────────────────────────────────────────────────────

function AttendanceSummary({ data }) {
  const stats = [
    { label: 'Present', value: data.present_days, color: 'text-green-600' },
    { label: 'Absent', value: data.absent_days, color: 'text-red-600' },
    { label: 'WFH', value: data.wfh_days, color: 'text-blue-600' },
    { label: 'On Leave', value: data.leave_days, color: 'text-purple-600' },
  ];
  return (
    <div className="panel p-4">
      <p className="text-xs font-semibold text-ink-500 mb-3">Attendance · {data.month}</p>
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value ?? 0}</p>
            <p className="text-xs text-ink-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Regularization List ───────────────────────────────────────────────────────

function RegularizationList({ items }) {
  if (!items.length) return <EmptyData message="No pending regularization requests." />;
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-ink-100 bg-ink-50 px-4 py-3">
        <h4 className="text-sm font-semibold text-ink-700">Pending Regularizations</h4>
      </div>
      <div className="divide-y divide-ink-50">
        {items.map((r) => (
          <div key={r.id} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-brand-700">{r.employee_name}</p>
              <span className="text-xs text-ink-400">#{r.id}</span>
            </div>
            <p className="text-sm text-ink-800">{r.work_date} · {r.issue_type?.replace(/_/g, ' ')}</p>
            <p className="text-xs text-ink-500">Requested: {r.requested_status} · {r.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payslip Card ─────────────────────────────────────────────────────────────

function PayslipCard({ data }) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-semibold text-ink-500 mb-3">Payslip · {data.month}</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Earnings', value: data.earnings, color: 'text-green-600' },
          { label: 'Deductions', value: data.deductions, color: 'text-red-500' },
          { label: 'Tax', value: data.tax, color: 'text-orange-500' },
          { label: 'Net Pay', value: data.net_pay, color: 'text-brand-700' },
        ].map((f) => (
          <div key={f.label} className="text-center">
            <p className={`text-xl font-extrabold ${f.color}`}>₹{Number(f.value).toLocaleString()}</p>
            <p className="text-xs text-ink-400">{f.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Policy List ───────────────────────────────────────────────────────────────

function PolicyList({ policies }) {
  if (!policies.length) return <EmptyData message="No policies found." />;
  return (
    <div className="space-y-3">
      {policies.map((p, i) => (
        <div key={i} className="panel p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-ink-900">{p.title}</p>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">{p.category}</span>
          </div>
          <p className="text-sm text-ink-600 leading-relaxed">{p.content}</p>
        </div>
      ))}
    </div>
  );
}

// ── Org Hierarchy ─────────────────────────────────────────────────────────────

function OrgHierarchy({ data }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="panel p-4">
        <p className="text-xs font-semibold text-ink-500 mb-2">Departments</p>
        <div className="space-y-1">
          {(data.departments || []).map((d) => (
            <div key={d.id} className="flex items-center justify-between text-sm">
              <span className="text-ink-800">{d.name}</span>
              <span className="font-mono text-xs text-ink-400">{d.code}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel p-4">
        <p className="text-xs font-semibold text-ink-500 mb-2">Designations</p>
        <div className="space-y-1">
          {(data.designations || []).map((d) => (
            <div key={d.id} className="flex items-center justify-between text-sm">
              <span className="text-ink-800">{d.title}</span>
              <span className="text-xs text-ink-400">L{d.level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Recruitment Summary ───────────────────────────────────────────────────────

function RecruitmentSummary({ data }) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-ink-100 bg-ink-50 px-4 py-3">
        <h4 className="text-sm font-semibold text-ink-700">Recruitment Pipeline</h4>
      </div>
      <div className="divide-y divide-ink-50">
        {(data.candidates || []).map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink-900">{c.name}</p>
              <p className="text-xs text-ink-400">{c.job}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function EmptyData({ message }) {
  return (
    <div className="panel py-8 text-center">
      <p className="text-sm text-ink-400">{message}</p>
    </div>
  );
}

function statusColor(status) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
    success: 'bg-green-100 text-green-700',
    applied: 'bg-blue-100 text-blue-700',
    shortlisted: 'bg-purple-100 text-purple-700',
    offered: 'bg-amber-100 text-amber-700',
    hired: 'bg-green-100 text-green-700',
  };
  return map[status] || 'bg-ink-100 text-ink-600';
}
