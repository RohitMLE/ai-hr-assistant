import { useEffect, useState } from 'react';
import { getOrgHierarchy } from '../api/modules/coreHr';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function CoreHRPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrgHierarchy()
      .then((res) => setData(res))
      .catch(() => setError('Failed to load organization data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading Employee Master..." />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Core HR: Employee Master</h1>
        <p className="text-ink-500">Manage organization structure, departments, and designations.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Departments */}
        <section className="panel p-6">
          <h2 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-brand-500 rounded-full" />
            Departments
          </h2>
          <div className="space-y-3">
            {data?.departments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between p-4 rounded-lg bg-ink-50 border border-ink-100 hover:border-brand-200 transition-colors">
                <div>
                  <p className="font-bold text-ink-900">{dept.name}</p>
                  <p className="text-xs text-ink-400 font-mono uppercase">{dept.code}</p>
                </div>
                <button className="text-xs font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider">
                  View Staff
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Designations */}
        <section className="panel p-6">
          <h2 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-amber-500 rounded-full" />
            Designations
          </h2>
          <div className="space-y-3">
            {data?.designations.map((desig) => (
              <div key={desig.id} className="flex items-center justify-between p-4 rounded-lg bg-white border border-ink-100 shadow-sm">
                <p className="font-medium text-ink-800">{desig.title}</p>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-tight ring-1 ring-amber-500/20">
                  Lvl {desig.level}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modules Placeholder */}
      <div className="panel p-12 text-center bg-ink-50 border-dashed border-2 border-ink-200">
        <h3 className="text-lg font-bold text-ink-400">Employee List & Profiles</h3>
        <p className="text-sm text-ink-400 mt-2">Integrating existing recruitment and onboarding flows...</p>
      </div>
    </div>
  );
}
