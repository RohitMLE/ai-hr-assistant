import { useEffect, useState } from 'react';
import { getOnboardingDashboard, listOnboardingCases, updateOnboardingTask } from '../api/modules/onboarding';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { formatDate } from '../utils/format';
import { createAssetRequest, acknowledgePolicy } from '../api/modules/onboarding';

export default function OnboardingPage() {
  const [dashboard, setDashboard] = useState(null);
  const [cases, setCases] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [showAssetModal, setShowAssetModal] = useState(null);
  const [assetForm, setAssetForm] = useState({ asset_type: '', description: '' });

  const loadData = () => {
    setLoading(true);
    setError('');
    Promise.all([getOnboardingDashboard(), listOnboardingCases()])
      .then(([dashboardData, caseData]) => {
        setDashboard(dashboardData);
        setCases(caseData);
      })
      .catch(() => setError('Failed to load onboarding data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTaskStatus = async (task, status) => {
    setUpdatingTaskId(task.id);
    try {
      await updateOnboardingTask(task.id, { status });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update onboarding task.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await createAssetRequest(showAssetModal, assetForm);
      setShowAssetModal(null);
      setAssetForm({ asset_type: '', description: '' });
      loadData();
      alert('Asset requested successfully.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to request asset.');
    }
  };

  const handleAcknowledgePolicy = async () => {
    const policyId = prompt("Enter Policy ID to acknowledge (e.g. 1 or 2):");
    if (!policyId) return;
    try {
      await acknowledgePolicy(parseInt(policyId, 10));
      alert('Policy acknowledged successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to acknowledge policy.');
    }
  };

  if (loading) return <Loading label="Loading onboarding cases..." />;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Onboarding</h1>
          <p className="text-sm text-ink-500">Track candidate joining, checklist progress, and induction readiness.</p>
        </div>
        <button className="btn-secondary text-sm px-4 py-2" onClick={handleAcknowledgePolicy}>
          Acknowledge Policy
        </button>
      </header>

      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-5">
        <Metric label="Active cases" value={dashboard?.active_cases ?? 0} />
        <Metric label="Completed" value={dashboard?.completed_cases ?? 0} />
        <Metric label="Pending tasks" value={dashboard?.pending_tasks ?? 0} />
        <Metric label="In progress" value={dashboard?.in_progress_tasks ?? 0} />
        <Metric label="Overdue" value={dashboard?.overdue_tasks ?? 0} tone="danger" />
      </div>

      {cases.items.length === 0 ? (
        <EmptyState
          title="No onboarding cases"
          message="Finalize an offered candidate from recruitment to start an onboarding checklist."
        />
      ) : (
        <div className="space-y-5">
          {cases.items.map((item) => (
            <section key={item.id} className="rounded-lg border border-ink-200 bg-white">
              <div className="flex flex-col gap-3 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-ink-900">{item.title}</h2>
                    <Badge value={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    Candidate: {item.candidate_name || 'N/A'} · Employee: {item.employee_name || 'Not created yet'} · Joining {item.joining_date ? formatDate(item.joining_date) : 'TBD'}
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <p className="text-xs font-semibold text-ink-500">{item.tasks.length} checklist tasks</p>
                  <button 
                    className="text-xs font-bold text-brand-600 hover:text-brand-900"
                    onClick={() => setShowAssetModal(item.id)}
                  >
                    Request Asset
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-ink-50">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-ink-700">Task</th>
                      <th className="px-5 py-3 text-left font-semibold text-ink-700">Owner</th>
                      <th className="px-5 py-3 text-left font-semibold text-ink-700">Due</th>
                      <th className="px-5 py-3 text-left font-semibold text-ink-700">Status</th>
                      <th className="px-5 py-3 text-right font-semibold text-ink-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {item.tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-ink-900">{task.title}</p>
                          <p className="text-xs text-ink-400">{task.category}</p>
                        </td>
                        <td className="px-5 py-3 text-ink-600">{task.owner_role}</td>
                        <td className="px-5 py-3 text-ink-600">{task.due_date ? formatDate(task.due_date) : 'TBD'}</td>
                        <td className="px-5 py-3">
                          <Badge value={task.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          {task.status === 'completed' ? (
                            <button
                              type="button"
                              className="text-xs font-semibold text-amber-700 hover:underline"
                              disabled={updatingTaskId === task.id}
                              onClick={() => handleTaskStatus(task, 'in_progress')}
                            >
                              Reopen
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="text-xs font-semibold text-emerald-700 hover:underline"
                              disabled={updatingTaskId === task.id}
                              onClick={() => handleTaskStatus(task, 'completed')}
                            >
                              {updatingTaskId === task.id ? 'Saving...' : 'Mark done'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {showAssetModal && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-ink-900">Request IT Asset</h3>
              <button onClick={() => setShowAssetModal(null)} className="text-ink-500 hover:text-ink-900">✕</button>
            </div>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase text-ink-500">Asset Type</span>
                <select 
                  className="input mt-1" 
                  value={assetForm.asset_type}
                  onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value })}
                  required
                >
                  <option value="">Select an asset...</option>
                  <option value="Laptop">Laptop (MacBook Pro)</option>
                  <option value="Monitor">External Monitor</option>
                  <option value="Mouse">Wireless Mouse</option>
                  <option value="Keyboard">Mechanical Keyboard</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-ink-500">Description / Notes</span>
                <textarea 
                  className="input mt-1 w-full"
                  value={assetForm.description}
                  onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                  placeholder="Optional details..."
                />
              </label>
              <button type="submit" className="btn-primary w-full">Submit Request</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone = 'default' }) {
  const toneClass =
    tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-ink-200 bg-white text-ink-900';

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
