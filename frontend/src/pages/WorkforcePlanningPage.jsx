import { useEffect, useState } from 'react';
import { api, getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function WorkforcePlanningPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/workforce-planning/plans');
      setPlans(data);
    } catch (err) {
      setError(getApiError(err, 'Failed to fetch workforce plans.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      await api.post('/workforce-planning/plans', { department_id: 1, year: 2026 });
      fetchPlans();
    } catch (err) {
      setError(getApiError(err, 'Failed to create plan.'));
    }
  };

  if (loading) return <Loading label="Loading Workforce Plans..." />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Workforce Planning</h1>
          <p className="text-ink-500">Manage headcount budgets and skill gaps.</p>
        </div>
        <button onClick={handleCreatePlan} className="px-4 py-2 bg-brand-600 text-white font-bold rounded hover:bg-brand-700">
          Create Draft Plan
        </button>
      </header>

      <section className="panel p-6">
        <h2 className="text-lg font-bold text-ink-900 mb-4">Current Plans</h2>
        {plans.length === 0 ? (
          <div className="text-ink-500 text-sm italic">No workforce plans found.</div>
        ) : (
          <div className="space-y-3">
            {plans.map((p) => (
              <div key={p.id} className="flex justify-between items-center p-4 border rounded-lg bg-ink-50">
                <div>
                  <div className="font-bold">Plan {p.year} (Dept #{p.department_id})</div>
                  <div className="text-sm text-ink-500">Status: {p.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
