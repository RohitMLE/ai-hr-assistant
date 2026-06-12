import { useEffect, useState } from 'react';
import { getMyPayslips } from '../api/modules/payroll';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function PayslipPage() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyPayslips();
      setPayslips(data.items || []);
    } catch (err) {
      setError(getApiError(err, 'Unable to load payslips.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">My Payslips</h1>
          <p className="mt-1 text-sm text-ink-500">View your detailed salary statements.</p>
        </div>
      </div>

      <div className="mt-6">
        {error ? <Alert>{error}</Alert> : null}
        {loading ? (
          <Loading label="Loading payslips..." />
        ) : payslips.length === 0 ? (
          <div className="panel p-8 text-center text-ink-500">No payslips found.</div>
        ) : (
          <div className="flex flex-col gap-8">
            {payslips.map((payslip) => (
              <div key={payslip.id} className="panel p-6 border-l-4 border-brand-500">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-ink-900">Payslip for {payslip.month}</h2>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink-500 uppercase">Net Pay</p>
                    <p className="text-2xl font-bold text-brand-700">₹{payslip.net_pay.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-ink-700 mb-3 border-b pb-2">Earnings</h3>
                    <ul className="space-y-2">
                      {payslip.components.filter(c => c.type === 'earning').map(c => (
                        <li key={c.id} className="flex justify-between text-sm">
                          <span className="text-ink-600">{c.name}</span>
                          <span className="font-medium">₹{c.amount.toLocaleString()}</span>
                        </li>
                      ))}
                      <li className="flex justify-between text-sm font-bold pt-2 border-t mt-2">
                        <span>Total Earnings</span>
                        <span>₹{payslip.earnings.toLocaleString()}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-700 mb-3 border-b pb-2">Deductions</h3>
                    <ul className="space-y-2">
                      {payslip.components.filter(c => c.type === 'deduction').map(c => (
                        <li key={c.id} className="flex justify-between text-sm">
                          <span className="text-ink-600">{c.name}</span>
                          <span className="font-medium text-red-600">₹{c.amount.toLocaleString()}</span>
                        </li>
                      ))}
                      <li className="flex justify-between text-sm font-bold pt-2 border-t mt-2">
                        <span>Total Deductions</span>
                        <span className="text-red-600">₹{payslip.deductions.toLocaleString()}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
