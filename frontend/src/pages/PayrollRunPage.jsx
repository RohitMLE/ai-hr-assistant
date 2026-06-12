import { useEffect, useState } from 'react';
import { getPayrollRuns, processPayrollRun, approvePayrollRun } from '../api/modules/payroll';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function PayrollRunPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [month, setMonth] = useState('2026-05');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPayrollRuns();
      setRuns(data.items || []);
    } catch (err) {
      setError(getApiError(err, 'Unable to load payroll runs.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleProcess = async () => {
    setProcessing(true);
    setError('');
    try {
      await processPayrollRun(month);
      alert(`Successfully generated draft payroll for ${month}`);
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to process payroll.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (runId) => {
    if (!window.confirm('Are you sure you want to approve this payroll run? Payslips will be visible to employees.')) return;
    try {
      await approvePayrollRun(runId);
      alert('Payroll run approved!');
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to approve payroll.'));
    }
  };

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Payroll Processing</h1>
          <p className="mt-1 text-sm text-ink-500">Run and approve monthly payroll.</p>
        </div>
        <div className="flex items-end gap-3">
          <label>
            <span className="text-sm font-semibold text-ink-700">Month</span>
            <input
              className="input mt-1 w-44"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <button className="btn-primary" onClick={handleProcess} disabled={processing}>
            {processing ? 'Processing...' : 'Run Payroll'}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {error ? <Alert>{error}</Alert> : null}
        {loading ? (
          <Loading label="Loading runs..." />
        ) : (
          <div className="panel p-5">
            <table className="w-full text-left text-sm text-ink-600">
              <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Total Gross</th>
                  <th className="px-4 py-3">Total Net</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {runs.map(run => (
                  <tr key={run.id}>
                    <td className="px-4 py-3 font-bold text-ink-900">{run.month}</td>
                    <td className="px-4 py-3">₹{run.total_gross.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-brand-700">₹{run.total_net.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        run.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {run.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {run.status === 'draft' && (
                        <button className="text-brand-600 font-semibold hover:text-brand-800" onClick={() => handleApprove(run.id)}>
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {runs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-ink-500">No payroll runs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
