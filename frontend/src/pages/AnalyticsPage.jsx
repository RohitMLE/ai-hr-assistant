import { useEffect, useState } from 'react';
import { api, getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const [headcount, setHeadcount] = useState(null);
  const [turnover, setTurnover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hcRes, turnRes] = await Promise.all([
        api.get('/analytics/headcount-summary'),
        api.get('/analytics/turnover-rate')
      ]);
      setHeadcount(hcRes.data);
      setTurnover(turnRes.data);
    } catch (err) {
      setError(getApiError(err, 'Failed to fetch analytics data.'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading label="Loading Analytics..." />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Analytics Dashboard</h1>
        <p className="text-ink-500">Cross-module insights and reporting.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-lg font-bold text-ink-900 mb-4">Headcount by Department</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={headcount?.departments || []}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-6 flex flex-col justify-center items-center text-center">
          <h2 className="text-lg font-bold text-ink-900 mb-4">Turnover Rate ({turnover?.period})</h2>
          <div className="text-5xl font-black text-rose-600">
            {((turnover?.rate || 0) * 100).toFixed(1)}%
          </div>
          <p className="text-ink-500 mt-2 text-sm">Target: &lt; 8.0%</p>
        </section>
      </div>
    </div>
  );
}
