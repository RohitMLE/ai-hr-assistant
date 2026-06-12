import { useEffect, useState } from 'react';
import { getPayrollComponents, getTaxSlabs, getComplianceSettings } from '../api/modules/payrollConfig';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function PayrollConfigPage() {
  const [components, setComponents] = useState([]);
  const [slabs, setSlabs] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [compData, slabsData, compSettings] = await Promise.all([
        getPayrollComponents(),
        getTaxSlabs(),
        getComplianceSettings()
      ]);
      setComponents(compData);
      setSlabs(slabsData);
      setCompliance(compSettings);
    } catch (err) {
      setError(getApiError(err, 'Unable to load payroll configuration.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <h1 className="text-2xl font-bold text-ink-900">Payroll Configuration</h1>
      <p className="mt-1 text-sm text-ink-500">Manage salary components, tax slabs, and compliance rules.</p>

      <div className="mt-6">
        {error ? <Alert>{error}</Alert> : null}
        {loading ? (
          <Loading label="Loading config..." />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="panel p-5">
              <h2 className="text-lg font-bold text-ink-900 mb-4">Salary Components</h2>
              <table className="w-full text-left text-sm text-ink-600">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Taxable</th>
                    <th className="px-4 py-3">Computation</th>
                    <th className="px-4 py-3">Formula</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {components.map(c => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                      <td className="px-4 py-3">{c.type}</td>
                      <td className="px-4 py-3">{c.is_taxable ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3">{c.computation_type}</td>
                      <td className="px-4 py-3 font-mono text-xs">{c.formula || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="panel p-5">
              <h2 className="text-lg font-bold text-ink-900 mb-4">Tax Slabs</h2>
              <table className="w-full text-left text-sm text-ink-600">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Regime</th>
                    <th className="px-4 py-3">Min Income</th>
                    <th className="px-4 py-3">Max Income</th>
                    <th className="px-4 py-3">Rate %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {slabs.map(s => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 capitalize">{s.regime}</td>
                      <td className="px-4 py-3">₹{s.min_income.toLocaleString()}</td>
                      <td className="px-4 py-3">{s.max_income ? `₹${s.max_income.toLocaleString()}` : 'No Limit'}</td>
                      <td className="px-4 py-3">{s.tax_rate_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="panel p-5">
              <h2 className="text-lg font-bold text-ink-900 mb-4">Compliance Settings</h2>
              <table className="w-full text-left text-sm text-ink-600">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Ceiling Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {compliance.map(c => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                      <td className="px-4 py-3">{c.value}{c.is_percentage ? '%' : ''}</td>
                      <td className="px-4 py-3">{c.ceiling_limit ? `₹${c.ceiling_limit.toLocaleString()}` : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
