import { useEffect, useState } from 'react';
import { 
  getTeamPendingTravel, getFinancePendingTravel, approveTravelManager, disburseTravelAdvance,
  getTeamPendingClaims, getFinancePendingClaims, approveClaimManager, approveClaimFinance 
} from '../../api/modules/expenses';
import { getApiError } from '../../api/client';
import Alert from '../../components/Alert';
import Loading from '../../components/Loading';

export default function ApprovalsPage({ role }) {
  const [travelReqs, setTravelReqs] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (role === 'manager') {
        const [t, c] = await Promise.all([getTeamPendingTravel(), getTeamPendingClaims()]);
        setTravelReqs(t);
        setClaims(c);
      } else if (role === 'finance') {
        const [t, c] = await Promise.all([getFinancePendingTravel(), getFinancePendingClaims()]);
        setTravelReqs(t);
        setClaims(c);
      }
    } catch (err) {
      setError(getApiError(err, 'Failed to load approvals.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [role]);

  const handleTravelAction = async (id) => {
    try {
      if (role === 'manager') await approveTravelManager(id);
      if (role === 'finance') await disburseTravelAdvance(id);
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to update travel request.'));
    }
  };

  const handleClaimAction = async (id) => {
    try {
      if (role === 'manager') await approveClaimManager(id);
      if (role === 'finance') await approveClaimFinance(id);
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to approve claim.'));
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">
        {role === 'manager' ? 'Team Travel & Expense Approvals' : 'Finance Desk: Advances & Audits'}
      </h1>
      <p className="text-sm text-ink-500 mb-6">
        {role === 'manager' ? 'Review requests from your direct reports.' : 'Disburse cash advances and verify settled claims before payroll handoff.'}
      </p>

      {error && <Alert className="mb-4">{error}</Alert>}

      {loading ? <Loading /> : (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold mb-3 border-b pb-2">Travel Requests</h2>
            <div className="grid gap-4">
              {travelReqs.map(req => (
                <div key={req.id} className="panel p-4 flex justify-between items-center bg-blue-50 border-blue-200">
                  <div>
                    <h3 className="font-semibold text-ink-900">{req.employee_name} - {req.destination}</h3>
                    <p className="text-sm text-ink-600">{req.start_date} to {req.end_date}</p>
                    {req.advance_required && (
                      <p className="text-sm font-bold text-brand-700 mt-1">Advance Requested: ₹{req.advance_amount.toLocaleString()}</p>
                    )}
                  </div>
                  <button className="btn-primary" onClick={() => handleTravelAction(req.id)}>
                    {role === 'manager' ? 'Approve Travel' : 'Mark Advance Disbursed'}
                  </button>
                </div>
              ))}
              {travelReqs.length === 0 && <p className="text-sm text-ink-500 italic">No pending travel requests.</p>}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3 border-b pb-2">Expense Claims</h2>
            <div className="grid gap-4">
              {claims.map(claim => (
                <div key={claim.id} className="panel p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-ink-900">{claim.employee_name}</h3>
                      <p className="text-sm font-medium">{claim.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-ink-500 font-semibold">Net Payable</p>
                      <p className={`text-lg font-bold ${claim.net_payable < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{claim.net_payable.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-ink-50 p-3 rounded mb-4">
                    <ul className="space-y-1">
                      {claim.items?.map(item => (
                        <li key={item.id} className="flex justify-between text-sm">
                          <span>{item.date} - {item.category} ({item.description})</span>
                          <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-right">
                    <button className="btn-primary" onClick={() => handleClaimAction(claim.id)}>
                      {role === 'manager' ? 'Approve Claim' : 'Verify & Send to Payroll'}
                    </button>
                  </div>
                </div>
              ))}
              {claims.length === 0 && <p className="text-sm text-ink-500 italic">No pending claims.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
